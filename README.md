# Vyextrahování GTFS z JDF podle dopravce

## Instalace

`npm install`

## Spuštění

Skript se spouští příkazem

```bash
npm start <část názvu nebo IČO dopravce>
```

např. `npm start zlín`, nebo `npm start "Mladá bole"`

Pokud dopravce neexistuje, skript vypíše seznam známých dopravců.

## jdf2gtfs

Po spuštění skriptu se dá nad výstupem (adresář `temp/output`) zavolat skript [`jdf2gtfs`](https://github.com/masopust/jdf2gtfs/):

```bash
python3 jdf2gtfs.py --db_name gtfs --db_server localhost --db_user gtfs --db_password gtfs --zip --stopids --stopnames temp/output/ output/
```

### konfigurace `jdf2gtfs`:

```bash
pip3 install psycopg2==2.8.6 sqlalchemy==1.3.13 pandas==1.2.5
```
