import psycopg2
import psycopg2.extras
import json
import subprocess
import glob
import os
import codecs

connstr = "host=localhost user=postgres dbname=ouranos password=eeZqKqHx"
conn = psycopg2.connect(connstr)
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

def run_sql(sql):
  cur.execute(sql)
  conn.commit()

def drop_table(table):
  cur.execute('drop table if exists ' + table)
  conn.commit()

def import_geojson(path, table):
  try:
    codecs.open(path, encoding='utf-8', errors='strict').readlines()
  except UnicodeDecodeError:
    # Convert format
    with open(path, 'r', encoding="latin-1") as file_for_conversion:
      read_file_for_conversion = file_for_conversion.read()
      with open("./temp.geojson", 'w', encoding='utf-8') as converted_file:
        converted_file.write(read_file_for_conversion)
    path = "./temp.geojson"

  drop_table(table)
  args = ['ogr2ogr', '-f', 'PostgreSQL', 'PG:' + connstr, path, '-nln', table]
  subprocess.run(args)

  if path == './temp.geojson':
    os.remove("./temp.geojson")

def export_geojson(query, path):
  args = ['ogr2ogr', '-f', 'GeoJSON', path, 'PG:' + connstr, '-sql', query]
  subprocess.run(args)

def cut_cell(cell):
  # Import coastline
  import_geojson(f"./public/statiques/{cell}/lignedecote_{cell}.geojson", "lignedecote")

  # Create polygon in lignepoly
  cur.execute("""
  drop table if exists ligneseq;

  /* Get list of all points, start and end */
  create table ligneseq as with allpoints as (
  select id, ST_StartPoint(ST_GeometryN(wkb_geometry, 1)) as point from lignedecote
  union select id, ST_EndPoint(ST_GeometryN(wkb_geometry, 1)) as point from lignedecote
  )
  select a.id, a.wkb_geometry, startp.id as start_neighbor, endp.id as end_neighbor, startp.dist as start_dist, endp.dist as end_dist
  from lignedecote as a
  left join lateral (select allpoints.id, ST_Distance(ST_StartPoint(ST_GeometryN(a.wkb_geometry, 1)), allpoints.point) as dist from allpoints where allpoints.id <> a.id
  order by 2 asc
  limit 1
  ) as startp on true
  left join lateral (select allpoints.id, ST_Distance(ST_EndPoint(ST_GeometryN(a.wkb_geometry, 1)), allpoints.point) as dist from allpoints where allpoints.id <> a.id
  order by 2 asc
  limit 1
  ) as endp on true;

  update ligneseq set end_dist = null, end_neighbor = null where start_neighbor = end_neighbor and end_dist > start_dist;
  update ligneseq set start_dist = null, start_neighbor = null where start_neighbor = end_neighbor and end_dist < start_dist;

  drop table if exists ligneseq2;

  create table ligneseq2 as with recursive lignereq as (
  select * from (select *, 1::integer as seq, ARRAY[id] as visited, (end_neighbor is null) as inverted
  from ligneseq
  where start_neighbor is null or end_neighbor is null order by st_xmax(wkb_geometry) limit 1) as x
  union all
  select * from (
  select ls.*, array_length(visited, 1) + 1 as seq, ls.id || visited as visited, (ls.end_neighbor = lq.id) as inverted
  from ligneseq as ls
  inner join lignereq as lq on
  (ls.start_neighbor = visited[1] or ls.end_neighbor = visited[1])
  and not ls.id = any(visited)
  limit 1) as xx
  )
  select * from lignereq;

  update ligneseq2 set wkb_geometry = (select case when inverted then st_reverse(wkb_geometry) else wkb_geometry end);

  drop table if exists lignepoly;
  /* Start point is:
  select ST_StartPoint(st_geometryN(wkb_geometry, 1))::geometry as geom from ligneseq2 order by seq limit 1
  End point is:
  select ST_EndPoint(st_geometryN(wkb_geometry, 1))::geometry as geom from ligneseq2 order by seq desc limit 1
  */
  create table lignepoly as
  with sp as (select ST_StartPoint(st_geometryN(wkb_geometry, 1))::geometry as geom from ligneseq2 order by seq limit 1),
  ep as (select ST_EndPoint(st_geometryN(wkb_geometry, 1))::geometry as geom from ligneseq2 order by seq desc limit 1)
  select st_makepolygon(st_makeline(geom)) as poly from
  (
  select * from (select geom::geometry from ligneseq2, st_dumppoints(wkb_geometry) order by seq, path[2]) as x
  union all
  select (ST_SetSRID(st_makepoint(
  st_xmin((select geom from ep)) + (st_xmin((select geom from ep)) - st_xmin((select geom from sp))) * 0.2,
  st_ymin((select geom from ep)) + (st_ymin((select geom from ep)) - st_ymin((select geom from sp))) * 0.2
  ), 4326))
  union all
  select (ST_SetSRID(st_makepoint(
  st_xmin((select geom from ep)) - st_ymin((select geom from ep)) + st_ymin((select geom from sp)),
  st_ymin((select geom from ep)) + st_xmin((select geom from ep)) - st_xmin((select geom from sp))
  ), 4326))
  union all
  select (ST_SetSRID(st_makepoint(
  st_xmin((select geom from sp)) - st_ymin((select geom from ep)) + st_ymin((select geom from sp)),
  st_ymin((select geom from sp)) + st_xmin((select geom from ep)) - st_xmin((select geom from sp))
  ), 4326))
  union all
  select (ST_SetSRID(st_makepoint(
  st_xmin((select geom from sp)) - (st_xmin((select geom from ep)) - st_xmin((select geom from sp))) * 0.2,
  st_ymin((select geom from sp)) - (st_ymin((select geom from ep)) - st_ymin((select geom from sp))) * 0.2
  ), 4326))
  union all
  /* Start point */
  select * from sp as y

  ) as z
  """)
  conn.commit()

  # Create directory
  os.makedirs(f"./public/erosion/{cell}", exist_ok=True)

  # For each erosion
  for erosion in glob.glob(f"./public/erosion_orig/{cell}/*.geojson"):
    print(erosion)

    # Load erosion
    import_geojson(erosion, "erosion")

    # Generalize column type
    cur.execute("alter table erosion alter column wkb_geometry type geometry(Geometry, 4326)")
    conn.commit()

    # Cut
    cur.execute("update erosion set wkb_geometry = st_difference(ST_MakeValid(wkb_geometry), (select ST_MakeValid(poly) from lignepoly))")
    conn.commit()

    export_geojson("select * from erosion", erosion.replace("erosion_orig", "erosion"))

  # # Create directory
  # os.makedirs(f"./public/submersion/{cell}", exist_ok=True)

  # # For each submersion
  # for submersion in glob.glob(f"./public/submersion_orig/{cell}/*.geojson"):
  #   print(submersion)

  #   # Convert format
  #   with open(submersion, 'r', encoding="latin-1") as file_for_conversion:
  #     read_file_for_conversion = file_for_conversion.read()
  #     with open("./temp.geojson", 'w', encoding='utf-8') as converted_file:
  #       converted_file.write(read_file_for_conversion)

  #   # Load submersion
  #   import_geojson('./temp.geojson', "submersion")

  #   # Generalize column type
  #   cur.execute("alter table submersion alter column wkb_geometry type geometry(Geometry, 4326)")
  #   conn.commit()
  #   # Cut
  #   cur.execute("update submersion set wkb_geometry = st_difference(ST_MakeValid(wkb_geometry), (select ST_MakeValid(poly) from lignepoly))")
  #   conn.commit()

  #   export_geojson("select * from submersion", submersion.replace("submersion_orig", "submersion"))

def calc_batiment_submersion(cell):
  # TODO # BAD !!! public/statiques/delAnseauxCoques/batiments_delAnseauxCoques.geojson
  if cell == "delAnseauxCoques":
    return

  batiments = f"./public/statiques/{cell}/batiments_{cell}.geojson"
  import_geojson(batiments, "batiments")

  # Add depth
  run_sql("alter table batiments add column if not exists submersion_depth double precision")

  # for each submersion depth
  for depth in range(10, 0, -1):
    submersion = f"./public/submersion/{cell}/submersion_sansadapt_{cell}_0a{depth}m.geojson"
    if os.path.exists(submersion):
      print(submersion)
      import_geojson(submersion, "submersion")
      run_sql(f"update batiments set submersion_depth = {depth} where st_intersects(wkb_geometry, (select wkb_geometry from submersion))")

  export_geojson("select * from batiments", batiments)

cells = [
  "deRivieredesCaps",
  "deSaintPatrice",
  "delAnseauPersil",
  "delAnseauLard",
  "delAnseauxCoques",
  "deSainteFlavie",
  "delabaieMitis",
  "duCassePierre",
  "deMetissurMer",
]

for cell in cells:
  # cut_cell(cell) 
  calc_batiment_submersion(cell)


print("done")