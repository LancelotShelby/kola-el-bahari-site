import pandas as pd
import json
import os
from jinja2 import Environment, FileSystemLoader
from slugify import slugify

# --- Configuration ---
UNIVERSITIES_CSV = 'universities.csv'
PROGRAMS_CSV = 'programs.csv'
OUTPUT_DIR = 'unis'
TEMPLATES_DIR = 'templates'

# --- Setup Jinja2 Environment ---
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

# Load templates
explore_template = env.get_template('explore_template.html')
university_detail_template = env.get_template('university_detail_template.html')
program_detail_template = env.get_template('program_detail_template.html')
country_private_template = env.get_template('private_country_template.html')
country_public_template = env.get_template('public_country_template.html')

# --- Load Data ---
try:
    universities_df = pd.read_csv(UNIVERSITIES_CSV)
    programs_df = pd.read_csv(PROGRAMS_CSV)
except FileNotFoundError as e:
    print(f"Error: Missing CSV file. Make sure '{e.filename}' is in the same directory as the script.")
    exit()

# --- Data Processing ---
universities_data = universities_df.to_dict(orient='records')
programs_data = programs_df.to_dict(orient='records')

# Map programs to universities, create slugs, and calculate URLs
country_universities_by_type = {}
for uni in universities_data:
    uni['slug'] = slugify(uni['id'])
    uni_programs = [p for p in programs_data if p['university_id'] == uni['id']]
    sorted_programs = sorted(uni_programs, key=lambda x: int(x.get('priority', 9999)) if str(x.get('priority', '')).isdigit() else 9999)
    uni['programs'] = []
    uni['priority_programs'] = []

    for i, program in enumerate(sorted_programs):
        program_slug = slugify(program['name'])
        program['slug'] = program_slug
        program['internal_url'] = f"{program_slug}.html"
        uni['programs'].append(program)

        if i < 4 and (program.get('priority') is not None and str(program.get('priority')).strip() != ''):
            uni['priority_programs'].append(program)
        elif i < 4 and (program.get('priority') is None or str(program.get('priority')).strip() == ''):
            uni['priority_programs'].append(program)

    # Gather data for dynamic header
    country_slug = slugify(uni['country'])
    uni_type = uni['type'].lower()
    if country_slug not in country_universities_by_type:
        country_universities_by_type[country_slug] = []
    if uni_type not in country_universities_by_type[country_slug]:
        country_universities_by_type[country_slug].append(uni_type)

    # Calculate the full internal URL for the university page
    uni_page_filename = f"{uni['slug']}_university.html"
    uni['internal_url'] = os.path.join(OUTPUT_DIR, country_slug, uni['slug'], uni_page_filename).replace('\\', '/')

# Prepare data for explore page (to get all country names)
all_countries = sorted(list(universities_df['country'].unique()))

# --- HTML Generation ---
# Clear existing output directory for a clean build
if os.path.exists(OUTPUT_DIR):
    import shutil
    shutil.rmtree(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# NOW generate explore.html after all data has been processed
explore_output_path = 'explore.html'
with open(explore_output_path, 'w', encoding='utf-8') as f:
    f.write(explore_template.render(
        universities=universities_data,
        all_countries=all_countries,
        country_universities_by_type=country_universities_by_type,
        relative_path_prefix=""
    ))
print(f"Generated {explore_output_path}")

# Generate country, university, and program specific pages
for uni in universities_data:
    country_name = slugify(uni['country'])
    university_slug = uni['slug']

    country_dir = os.path.join(OUTPUT_DIR, country_name)
    os.makedirs(country_dir, exist_ok=True)
    university_dir = os.path.join(country_dir, university_slug)
    os.makedirs(university_dir, exist_ok=True)

    uni_page_filename = f"{university_slug}_university.html"
    uni_page_path = os.path.join(university_dir, uni_page_filename)
    with open(uni_page_path, 'w', encoding='utf-8') as f:
        f.write(university_detail_template.render(
            university=uni,
            country_universities_by_type=country_universities_by_type,
            relative_path_prefix="../../../"
        ))
    print(f"  Generated {uni_page_path}")

    for program in uni['programs']:
        program_filename = f"{university_slug}-{program['slug']}.html"
        program_path = os.path.join(university_dir, program_filename)
        program_page_uni_url = f"{university_slug}_university.html"

        with open(program_path, 'w', encoding='utf-8') as f:
            f.write(program_detail_template.render(
                university=uni,
                program=program,
                university_page_url=program_page_uni_url,
                country_universities_by_type=country_universities_by_type,
                relative_path_prefix="../../../"
            ))
        print(f"    Generated {program_path}")

# Generate country-specific private/public HTML files
for country_slug, types_exist in country_universities_by_type.items():
    country_dir = os.path.join(OUTPUT_DIR, country_slug)

    if 'private' in types_exist:
        private_filename = f"private-{country_slug}.html"
        private_path = os.path.join(country_dir, private_filename)
        with open(private_path, 'w', encoding='utf-8') as f:
            f.write(country_private_template.render(
                country_name=country_slug.replace('-', ' ').title(),
                country_universities_by_type=country_universities_by_type,
                relative_path_prefix="../../"
            ))
        print(f"  Generated {private_path}")

    if 'public' in types_exist:
        public_filename = f"public-{country_slug}.html"
        public_path = os.path.join(country_dir, public_filename)
        with open(public_path, 'w', encoding='utf-8') as f:
            f.write(country_public_template.render(
                country_name=country_slug.replace('-', ' ').title(),
                country_universities_by_type=country_universities_by_type,
                relative_path_prefix="../../"
            ))
        print(f"  Generated {public_path}")

print("\nHTML generation complete!")