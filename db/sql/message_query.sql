.mode tabs message;
.output bmp180_temp.dat
SELECT m.created_at,m.message FROM message AS m JOIN message_type AS mt ON m.message_type_id = mt.id JOIN sensor_type AS st ON m.sensor_type_id = st.id WHERE st.name = "BMP180" AND mt.name = "TEMP";
.output bmp180_pres.dat
SELECT m.created_at,m.message FROM message AS m JOIN message_type AS mt ON m.message_type_id = mt.id JOIN sensor_type AS st ON m.sensor_type_id = st.id WHERE st.name = "BMP180" AND mt.name = "PRES";
.output bmp180_alt.dat
SELECT m.created_at,m.message FROM message AS m JOIN message_type AS mt ON m.message_type_id = mt.id JOIN sensor_type AS st ON m.sensor_type_id = st.id WHERE st.name = "BMP180" AND mt.name = "ALT";
.output mpl3115a2_temp.dat
SELECT m.created_at,m.message FROM message AS m JOIN message_type AS mt ON m.message_type_id = mt.id JOIN sensor_type AS st ON m.sensor_type_id = st.id WHERE st.name = "MPL3115A2" AND mt.name = "TEMP";
.output mpl3115a2_pres.dat
SELECT m.created_at,m.message FROM message AS m JOIN message_type AS mt ON m.message_type_id = mt.id JOIN sensor_type AS st ON m.sensor_type_id = st.id WHERE st.name = "MPL3115A2" AND mt.name = "PRES";
.output mpl3115a2_alt.dat
SELECT m.created_at,m.message FROM message AS m JOIN message_type AS mt ON m.message_type_id = mt.id JOIN sensor_type AS st ON m.sensor_type_id = st.id WHERE st.name = "MPL3115A2" AND mt.name = "ALT";
.quit
