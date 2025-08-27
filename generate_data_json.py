import pandas as pd
import json
import os
from jinja2 import Environment, FileSystemLoader
from slugify import slugify
from collections import defaultdict
import math

# --- Configuration ---
UNIVERSITIES_CSV = 'universities.csv'
PROGRAMS_CSV = 'programs.csv'
OUTPUT_DIR = 'unis'
TEMPLATES_DIR = 'templates'
DATA_JSON_FILE = 'data.json'

# --- Setup Jinja2 Environment ---
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
env.filters['slugify'] = slugify

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

# --- Data Cleaning Step ---
def clean_data(data):
    """Recursively replaces NaN float values with None."""
    if isinstance(data, dict):
        return {key: clean_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_data(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None
    else:
        return data

# --- Data Processing ---
universities_data = universities_df.to_dict(orient='records')
programs_data = programs_df.to_dict(orient='records')

universities_data = clean_data(universities_data)
programs_data = clean_data(programs_data)

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

    uni['internal_url'] = os.path.join(OUTPUT_DIR, slugify(uni['country']), uni['slug'], f"{uni['slug']}_university.html").replace('\\', '/')
    
    uni['explore_url'] = f"unis/{slugify(uni['country'])}/{uni['slug']}/{uni['slug']}_university.html"
    uni['explore_logo'] = uni['logo']

with open(DATA_JSON_FILE, 'w', encoding='utf-8') as f:
    json.dump(universities_data, f, ensure_ascii=False, indent=4)
print(f"Generated {DATA_JSON_FILE}")

country_universities_by_type = defaultdict(lambda: defaultdict(list))
for uni in universities_data:
    country = uni['country']
    uni_type = uni['type'].lower()
    university_info = {
        'name': uni['name'],
        'slug': uni['slug'],
        'country_slug': slugify(country),
        'logo': uni.get('logo'),  # Ensure logo is included
        'country': uni.get('country'),
        'type': uni.get('type'),
        'internal_url': uni.get('internal_url'),
    }
    country_universities_by_type[country][uni_type].append(university_info)

ROOT_PREFIX = ""
ONE_LEVEL_PREFIX = "../"
TWO_LEVEL_PREFIX = "../../"
THREE_LEVEL_PREFIX = "../../../"
FOUR_LEVEL_PREFIX = "../../../../"

if os.path.exists(OUTPUT_DIR):
    import shutil
    shutil.rmtree(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR, exist_ok=True)

explore_output_path = 'explore.html'
with open(explore_output_path, 'w', encoding='utf-8') as f:
    f.write(explore_template.render(
        relative_path_prefix=ROOT_PREFIX,
        country_universities_by_type=country_universities_by_type,
        all_countries=sorted(list(universities_df['country'].unique())) 
    ))
print(f"Generated {explore_output_path}")

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
            relative_path_prefix=THREE_LEVEL_PREFIX
        ))
    print(f"    Generated {uni_page_path}")

    for program in uni['programs']:
        program_filename = f"{program['slug']}.html"
        program_path = os.path.join(university_dir, program_filename)
        
        program_page_uni_url = f"{university_slug}_university.html"
    
        with open(program_path, 'w', encoding='utf-8') as f:
            f.write(program_detail_template.render(
                university=uni,
                program=program,
                university_page_url=program_page_uni_url,
                country_universities_by_type=country_universities_by_type,
                relative_path_prefix=THREE_LEVEL_PREFIX
            ))
        print(f"      Generated {program_path}")

# --- Generate country-specific private/public HTML files (CORRECTED) ---
country_types = {}
for uni in universities_data:
    country_slug = slugify(uni['country'])
    if country_slug not in country_types:
        country_types[country_slug] = {'private': False, 'public': False, 'name': uni['country']}
    
    uni_type = uni['type'].lower()
    country_types[country_slug][uni_type] = True

for country_slug, types_exist in country_types.items():
    country_dir = os.path.join(OUTPUT_DIR, country_slug)
    os.makedirs(country_dir, exist_ok=True)
    
    country_name_title = types_exist['name']

    if types_exist['private']:
        private_filename = f"private-{country_slug}.html"
        private_path = os.path.join(country_dir, private_filename)
        private_unis = country_universities_by_type.get(country_name_title, {}).get('private', [])
        with open(private_path, 'w', encoding='utf-8') as f:
            f.write(country_private_template.render(
                country_name=country_name_title,
                unis=private_unis,
                country_universities_by_type=country_universities_by_type,
                relative_path_prefix=TWO_LEVEL_PREFIX
            ))
        print(f"  Generated {private_path}")
    
    if types_exist['public']:
        public_filename = f"public-{country_slug}.html"
        public_path = os.path.join(country_dir, public_filename)
        public_unis = country_universities_by_type.get(country_name_title, {}).get('public', [])
        with open(public_path, 'w', encoding='utf-8') as f:
            f.write(country_public_template.render(
                country_name=country_name_title,
                unis=public_unis,
                country_universities_by_type=country_universities_by_type,
                relative_path_prefix=TWO_LEVEL_PREFIX
            ))
        print(f"  Generated {public_path}")

print("\nHTML generation complete!")