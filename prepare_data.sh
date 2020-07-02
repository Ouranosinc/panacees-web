#!/bin/bash

rm -r public/data
mkdir public/data
mkdir public/data/cells
mkdir public/data/mrcs

# Copy global files
cp input_data/mrcs.geojson public/data/
cp input_data/adaptations.csv public/data/
cp input_data/valorisation.csv public/data/

# Split geojson files by mrc
node scripts/split_geojson_by_mrc sub_cellules
node scripts/split_geojson_by_mrc trait_de_cote

# Split geojson files by cell
node scripts/split_geojson_by_cell point_role
node scripts/split_geojson_by_cell polygone_role
node scripts/split_geojson_by_cell polygone_infras
node scripts/split_geojson_by_cell line_infras
node scripts/split_geojson_by_cell polygone_agri
node scripts/split_geojson_by_cell polygone_enviro

# Process csv files to split when necessary
node scripts/process_csvs