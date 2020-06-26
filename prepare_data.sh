#!/bin/bash

mkdir public/data
mkdir public/data/cells

# Copy global files
cp input_data/mrcs.geojson public/data/
cp input_data/adaptations.csv public/data/
cp input_data/adaptations_disponibles.csv public/data/
cp input_data/affichage_adaptations.csv public/data/
cp input_data/hauteur.csv public/data/
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

# Split csv files by cell and scenario
node scripts/split_csvs