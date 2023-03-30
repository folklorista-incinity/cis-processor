#!/bin/bash

#wget ftp://ftp.cisjr.cz/JDF/JDF.zip
#unzip JDF.zip -d zips
 
unzip -p *.zip path/to/zipped/file.txt >file.txt

for variable in list; do
    
done
# 
# 
# # z ftp://ftp.cisjr.cz/ stáhnout soubor JDF/JDF.zip
# 
# soubor rozbalit a rozbalit i všechny ZIP soubory, které jsou vevnitř,
# skriptem proběhnout všechny adresáře a v souborech Udaje.txt a Linky.txt vyhledeat linky, které nás zajímají (seznam linek by měl jít zadat konfiguračně)
# skript může být prakticky v čemkoliv, ale ideální by byl Node.js, nebo Python
# jako příkaz jsem používal něco ve tvaru grep -i -R --include="*Udaje.txt*" 265140 .
# nalezené složky převést do formátu GTFS pomocí nástroje https://github.com/masopust/jdf2gtfs
# 