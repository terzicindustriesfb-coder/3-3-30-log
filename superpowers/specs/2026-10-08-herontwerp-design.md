# 3-3-30 Log: herontwerp

Datum: 8 oktober 2026
Status: ontwerp, ter controle

De schermontwerpen staan in het canvas "3-3-30 Log herontwerp". Dit document legt
vast wat er gebouwd wordt en volgens welke regels. Waar het canvas en dit document
verschillen, geldt dit document. Teksten tussen "aanhalingstekens" zijn de Engelse
teksten in de app.

## 1. Doel

De app is voor Steef en zijn trainingsmaatje, op de telefoon in de sportschool.
Hij moet in één oogopslag drie dingen zeggen:

1. Wat doe ik vandaag?
2. Wat moet ik verslaan?
3. Hoe staat mijn week, en die van mijn maatje?

Het trainen zelf (klok, reps tikken) werkt goed en blijft zoals het is. Het
onoverzichtelijke zit eromheen: het doel staat klein, de week is onzichtbaar,
oefeningen instellen is zoeken, voortgang is de eerste weken leeg en het maatje
zit verstopt.

### Gekozen richting

| Onderwerp | Keuze |
|---|---|
| Indeling | Twee schermen, "Today" en "Progress", met een schakelaar onderin |
| Hoofdgetal | Reps op een gewicht. Kilo's getild alleen als totaal per training en per week |
| A/B/C | Loopt door: na A komt B, na B komt C, ook over het weekend heen |
| Verplaatsen | Train je op een rustdag, dan verhuist een geplande training naar die dag: eerst een gemiste, anders de eerstvolgende. De week is ook vooraf aan te passen |
| Oefeningen | Hernoemen behoudt scores. Een andere oefening kies je uit een lijst. De app zet namen niet meer zelf om |
| Uitleg | Korte uitleg per groep (push, pull, legs), niet per oefening |
| Trainingsmodus | Ongewijzigd, op het eindscherm na (2.14) |

### Niet in dit ontwerp

- Uitleg per oefening.
- Historie van twee oefeningen samenvoegen.
- Andere weken dan de huidige vooruit plannen.
- Een aparte lijst van oefeningen die niet meer in je schema staan. Hun scores
  blijven bewaard en komen terug zodra je de oefening weer kiest. In het log
  blijven die trainingen staan.
- Meldingen, meerdere talen, nieuwe soorten grafieken.

### Verschillen met de schermontwerpen

- Verplaatsen haalt eerst een gemiste dag in (5.3). Het ontwerp toont alleen het
  naar voren halen van de volgende training.
- "Exercise" heeft vijf knoppen voor de soort gewicht, niet vier (2.9).
- Een regel in het log toont ook de reps per oefening. Het oordeel is altijd
  "2 of 2 beaten", ook als er "1 heavier" achter staat (2.11).
- Onder het resultaat van vandaag staan ook "Train again today" en "Your plan"
  (2.5).
- De kaart "This week" op "Progress" staat er vanaf de eerste week (2.11).
- Het eindscherm van de trainingsmodus krijgt dezelfde resultaatregels (2.14).

## 2. Schermen

### 2.1 Navigatie

- Onderin staat een vaste schakelaar met twee knoppen: "Today" en "Progress". Hij
  verschijnt zodra je een profiel hebt. Na opnieuw laden sta je op "Today".
- Alles wat je zelden doet opent als een blad van onderaf: "Your plan",
  "This week", "Exercise", "Swap workout", "Settings", een training loggen of
  wijzigen, en de historie van één oefening.
- Er ligt nooit meer dan één blad open. Open je "Exercise" vanuit "Your plan",
  dan kom je na opslaan of sluiten terug in "Your plan". Alle andere bladen
  sluiten naar het scherm eronder.
- De bovenbalk blijft: logo links, tandwiel rechts.

### 2.2 Today

Van boven naar beneden:

1. Datumregel ("Wed 14 Oct · today") en titel.
2. Weekstrook (2.3).
3. Kaart met de training.
4. Hoofdknop en tekstlinks.

Met één maatje past dit zonder scrollen op een gewone telefoon (390 × 844).

Welke situatie geldt, bepaalt de app in deze volgorde. De eerste die klopt, wint.

| Situatie | Titel | Kaart | Hoofdknop | Links eronder |
|---|---|---|---|---|
| Op dit toestel staat een training open | "Workout in progress" | De oefeningen van die training met wat al gedaan is, zoals nu | "Resume workout" | "Discard it" |
| Vandaag ligt vóór je startdatum | "Get ready" | De eerste training: drie oefeningen | "Try a practice workout" | "Your plan", "Swap workout" |
| Vandaag al getraind | "Workout A done" | Resultaat van vandaag (2.5) | Geen | Zie 2.5 |
| Vandaag is gepland | "Workout A" | Drie oefeningen met doel (2.4) | "Start · 30 min" | "Your plan", "Swap workout" |
| Vandaag is niet gepland | "Rest day" | "Next up · Wed 14 Oct", "Workout A", drie oefeningen met doel | "Train today instead" of "Train anyway" (5.3) | "Your plan", "Change this week" |

- "Your plan" opent 2.7, "Swap workout" opent 2.6, "Change this week" opent 2.8.
- Vóór je startdatum is de datumregel "You start Monday 12 October" en ontbreekt
  de weekstrook.
- Op een rustdag start de knop de training die aan de beurt is. Wil je op zo'n dag
  een andere letter, zet de dag dan eerst aan in "This week".
- Bij "Same every time" zijn de titels "Today’s workout" en "Workout done". De
  regel "Workout A" op een rustdag en de link "Swap workout" ontbreken dan.
- De tip om zwaarder te gaan ("… went well. Go up to … ?") blijft onder de
  oefeningen staan zoals nu.
- "Log a past workout" verhuist van deze kaart naar "Progress" (2.11).

### 2.3 Weekstrook

Een kaart met de zeven dagen van de huidige week (maandag tot en met zondag), één
rij per persoon. De eerste rij is "You". Daaronder staan maximaal drie maatjes,
in volgorde van aanmelden. Zijn er meer, dan staat er een regel "+2 more" die
naar "Progress" gaat.

| Toestand van een dag | Jouw rij | Rij van een maatje |
|---|---|---|
| Getraind | Gevuld rondje met de letter van die training | Gevuld rondje met een vinkje |
| Vandaag, gepland | Dikke ring met de letter die aan de beurt is | Dunne ring |
| Vandaag, niet gepland | Gestippelde ring, leeg | Klein puntje |
| Gepland, komt nog | Dunne ring met de verwachte letter | Dunne ring |
| Gemist | Dunne gestippelde ring, leeg | Dunne gestippelde ring, leeg |
| Rust | Klein puntje | Klein puntje |

- Wat gepland, gemist en rust is, staat in 5.1. De letters volgen sectie 4.
- De kolom van vandaag heeft een onderstreepte dagletter.
- Rechts staat de teller, bijvoorbeeld "1/3": trainingen die tellen deze week,
  gedeeld door het aantal geplande dagen van deze week. Er is geen maximum:
  "4/3" kan. Is er niets gepland en niets gedaan, dan staat er geen teller.
- Twee trainingen op één dag: het rondje toont de letter van de laatste.
- Tik je op de strook of op het potloodje rechtsboven, dan opent "This week" (2.8).
- Staat de instelling op "Same every time", dan staan er geen letters in jouw
  rondjes: getraind krijgt een vinkje.

### 2.4 Een oefening op Today

Elke regel is een knop over de volle breedte:

- Links het gekleurde schijfje van de groep (rood push, blauw pull, geel legs).
- In het midden de naam, met het gewicht eronder (bijvoorbeeld "35 kg" of
  "2 × 10 kg").
- Rechts het doel, groot: het aantal reps van de te verslaan score (sectie 3),
  met eronder "reps to beat". Is het ingestelde gewicht zwaarder dan dat van die
  score, dan staat er "reps to match".
- Heeft de oefening nog geen score, dan staat er rechts "First time".

Tik op de regel en het blad "Exercise" opent (2.9).

### 2.5 Na je training

De kaart toont de training van vandaag. Zijn het er twee, dan de laatste.

- Per oefening de naam, het gewicht en groot het aantal reps.
- Onder het getal staat het oordeel. De app vergelijkt met de te verslaan score
  van vóór deze training.

| Geval | Tekst |
|---|---|
| Eerste score van deze oefening | "first score" |
| Zelfde gewicht, meer reps | "▲ +4" (groen) |
| Zelfde gewicht, evenveel reps | "same as last time" |
| Zelfde gewicht, minder reps | "▼ −3" |
| Zwaarder dan de te verslaan score | "+5 kg" |
| Lichter dan de te verslaan score | "−5 kg" |
| Blok gestopt vóór de tien minuten | "stopped early", in plaats van een oordeel |
| Overgeslagen | "skipped", zonder getal |

- Onderaan de kaart: "Lifted in total" met het totaal in kilo's (gewicht × reps).
  Dit vervalt als het totaal nul is.
- Onder de kaart: "Next: Wed 7 Oct · Workout B" (bij "Same every time" zonder de
  letter), de link "Edit" (opent het wijzigblad van deze training), de link
  "Train again today" (start de training die aan de beurt is) en de link
  "Your plan".

### 2.6 Swap workout

Een klein blad met drie keuzes: Workout A, B en C, elk met de drie
oefeningnamen eronder. De training die aan de beurt is heeft het label
"Next in line".

- Je keuze geldt voor de training die je daarna start. De titel, de kaart en de
  letter van vandaag in de weekstrook tonen de gekozen training.
- De keuze vervalt zodra die training is opgeslagen, en ook als je de pagina
  opnieuw laadt.
- Na die training loopt de volgorde door vanaf de letter die je deed.
- Bij "Same every time" bestaat deze link niet.

### 2.7 Your plan

Eén blad met alles wat bij je schema hoort:

1. "Training days": zeven dagknoppen voor je vaste dagen. De bestaande regel
   blijft: minimaal één, maximaal drie. Een wijziging gaat in vanaf vandaag (5.2).
2. Drie kaarten, "Workout A", "Workout B" en "Workout C", elk met drie
   oefeningen: schijfje, naam, gewicht. Rechts in de kop staat wanneer die
   training weer aan de beurt is: "Today" of een datum (5.4). Tik op een oefening
   en het blad "Exercise" opent.
3. Onderaan de uitleg van push, pull en legs (6.4).

Bij "Same every time" staat er één kaart, "Every workout".

De keuze tussen "Workout A, B, C" en "Same every time" blijft in "Settings".
"Training days" verhuist van "Settings" naar dit blad.

### 2.8 This week

Een blad met de zeven dagen van de huidige week onder elkaar. Onder de titel
staat "Mon 12 – Sun 18 Oct · tap a day to train or rest". Per dag: de datum, het
rondje uit de weekstrook, een korte status en een schakelaar.

| Dag | Status | Schakelaar |
|---|---|---|
| Getraind | "Done" | Geen, er staat een vinkje |
| Voorbij, gemist | "Missed" | Geen |
| Voorbij, rust | "Rest" | Geen |
| Vandaag, gepland | "Today" | Aan |
| Later, gepland | "Planned" | Aan |
| Vandaag of later, niet gepland | "Rest" | Uit |

- Elke tik op een schakelaar slaat direct op. De weekstrook erachter volgt mee.
- Staat er een dag aan die geen vaste dag is, en staat er een vaste dag uit, dan
  horen die bij elkaar: de eerste extra dag bij de eerste uitgezette vaste dag,
  de tweede bij de tweede. Bij de extra dag staat dan achter de status
  "· moved from Wed". Voorbeeld: "Today · moved from Wed".
- Onder de lijst: "Only this week changes. Your usual days stay Mon, Wed and Fri."
  met de link "Change usual days" (opent "Your plan").
- Onderaan de knop "Done". Die sluit het blad.

De regels staan in 5.2.

### 2.9 Exercise

Het blad voor één oefening in je schema:

1. Kop met het schijfje, de groep en de training ("Push · Workout A"; bij
   "Same every time" alleen "Push").
2. "Name": een tekstveld met de huidige naam. Eronder: "Rename it and your
   scores stay with it."
3. "Weight type": vijf knoppen, "Barbell", "Dumbbells (pair)", "One dumbbell",
   "Machine / cable" en "Bodyweight". Dit zijn de vijf soorten die de app nu al
   kent; het schermontwerp toont er vier. De regels staan in 6.2.
4. "Next weight": min, het gewicht, plus. Ernaast de stapgrootte
   ("steps of 2.5 kg").
5. "Score to beat": het doel met gewicht en datum ("At 35 kg · Mon 5 Oct",
   "62 reps"). Vervalt als er nog geen score is.
6. De knop "Save". Die slaat naam, soort gewicht en gewicht op, meldt "Saved." en
   sluit het blad.
7. De knop "Switch to another exercise", met eronder "Another exercise keeps its
   own scores." Wat je in dit blad veranderde maar niet opsloeg, vervalt dan.

### 2.10 Een andere oefening kiezen

Dezelfde bladruimte wisselt naar de keuzelijst, met een terugknop:

1. Titel: "Choose a push exercise" (of pull, legs).
2. De uitleg van die groep (6.4).
3. Een zoekveld: "Search, or type your own". Zoeken werkt zoals in 6.3 staat.
4. "In your plan": de oefeningen van deze groep die in A, B of C staan, elk één
   keer. Eronder de soort gewicht en de training ("Barbell · Workout A"; staat
   hij in twee trainingen: "Workout A and C"). De huidige heeft een vinkje.
5. "More push exercises": alle andere van deze groep, op alfabet, met de soort
   gewicht eronder. Eigen oefeningen staan er ook tussen.
6. De knop "Add your own exercise".

Vindt het zoekveld niets, dan staat er "No push exercise called “…”." boven de
knop "Add your own exercise".

Tik op een oefening: hij komt direct in je schema, er verschijnt kort
"… is in Workout A." en je bent terug op het blad "Exercise" van de nieuwe
oefening, zodat je het gewicht kunt zetten. Tik je op de huidige, dan ga je
alleen terug.

"Add your own exercise" wisselt in hetzelfde blad naar "New push exercise":

- "Name": staat al ingevuld met wat je zocht.
- "Weight type": dezelfde vijf knoppen. De app zet er één voor op basis van de
  naam; jij kunt een andere kiezen.
- De knop "Add exercise". Daarna gaat het verder zoals bij een tik op een
  oefening. De naamregels staan in 6.3.

### 2.11 Progress

Van boven naar beneden:

1. Titel "Progress" met rechts de keuze "Me" en de namen van je maatjes.
2. Kaart "This week": "2 of 3 workouts" (dezelfde getallen als de teller in de
   weekstrook) en rechts het aantal kilo's dat je deze week tilde ("kg lifted").
   Het getal vervalt als het nul is. Is er niets gepland en niets gedaan, dan
   staat er "Nothing planned this week." De kaart ontbreekt vóór je startdatum.
3. Kaart "Your scores" met de keuze A, B, C. Standaard staat de training die aan
   de beurt is. Per oefening één regel (zie hieronder). Bij "Same every time" is
   er geen keuze en staan er drie regels.
4. Kop "Log" met de link "Log a past workout".
5. De lijst met trainingen, nieuwste boven: de trainingen die tellen en de
   oefentrainingen (sectie 3). Eerst acht, daarna "Show all 14 workouts". Zonder
   trainingen staat er "No workouts yet."

**Een regel in "Your scores".** De regel kijkt naar de reeks voor Progress van
die oefening (sectie 3).

| Aantal scores in de reeks | Onder de naam | Rechts |
|---|---|---|
| Geen | Het ingestelde gewicht | "No score yet" |
| Eén | "35 kg · first score, Mon 5 Oct" | Het getal, met "reps" eronder |
| Twee of meer, de laatste twee op hetzelfde gewicht | "35 kg · best 68" | Lijntje, het laatste getal, en "▲ +3", "▼ −2" of "same" |
| Twee of meer, de laatste op een ander gewicht dan de vorige | "80 kg · was 88 at 75 kg" | Lijntje, het laatste getal, en "+5 kg" of "−5 kg" |

- Het gewicht onder de naam is dat van de laatste score.
- "best" is het hoogste aantal reps op dat gewicht.
- Het lijntje toont de reps van de laatste acht scores uit de reeks.
- Tik op een regel: een blad opent met de historie van die oefening. Daarin
  staan de twee bestaande grafieken (reps en kilo's getild) en een lijst van alle
  keren met datum, gewicht en reps, nieuwste boven.

**Een regel in het log.**

- Links de datum en de letter van de training. Een oefentraining heeft
  "practice" in plaats van een letter.
- Daarnaast op de eerste regel de reps van push, pull en legs, bijvoorbeeld
  "62 · 77 · 85 reps". Een overgeslagen oefening is een streepje.
- Daaronder het oordeel in het kort. Het bestaat uit deze delen, in deze
  volgorde, met " · " ertussen. Een deel dat nul is, vervalt.

| Deel | Tekst | Telt |
|---|---|---|
| Verslagen | "2 of 3 beaten" | Oefeningen op hetzelfde gewicht als de te verslaan score: hoeveel daarvan meer reps hadden |
| Zwaarder | "1 heavier" | Oefeningen op een zwaarder gewicht |
| Lichter | "1 lighter" | Oefeningen op een lichter gewicht |
| Eerste keer | "1 first score", "3 first scores" | Oefeningen zonder eerdere score |
| Vroeg gestopt | "1 stopped early" | Blokken die vóór de tien minuten stopten; die tellen in de andere delen niet mee |

  Voorbeelden: "3 first scores", "2 of 3 beaten", "2 of 2 beaten · 1 heavier".
  Een oefentraining heeft geen oordeel.
- Tik op je eigen training: het wijzigblad opent.
- Tik op een training van je maatje: een leesblad opent met per oefening naam,
  gewicht en reps.

**Bij een maatje** zie je hetzelfde scherm met zijn gegevens: zijn week, zijn
schema, zijn namen. De kop van de scores is dan "[Naam]’s scores".
"Log a past workout" en wijzigen ontbreken. Heeft hij nog niets gelogd, dan
staat er "[Naam] hasn’t logged a workout yet."

### 2.12 Een training loggen of wijzigen

Het bestaande blad blijft, met deze veranderingen:

- De oefening per groep is geen vrij tekstveld meer maar een keuzelijst met de
  oefeningen van die groep. Bovenaan staan de oefeningen uit je schema, daaronder
  de rest. Staat er in een oude training een oefening die niet in die lijst
  voorkomt, dan staat die er voor dat ene veld bij.
- Een oefening die nog niet bestaat maak je eerst aan via "Your plan" (2.10).
- De letter die het blad voorstelt volgt de nieuwe regel (sectie 4).
- Na het opslaan geldt de verhuisregel (5.3).

De vraag achteraf "Use these from now on?" blijft als je andere oefeningen logde
dan in je schema staan.

### 2.13 Settings

Blijft: naam, "Workout A, B, C" of "Same every time", geluid, aftellen, back-up,
uitleg over samen trainen, uitloggen en "How 3-3-30 works".

- "Training days" gaat naar "Your plan".
- Onder "How 3-3-30 works" komt de uitleg van push, pull en legs erbij (6.4).
- Teksten die naar oude plekken wijzen worden aangepast. Op het welkomscherm
  wordt "change it any time with the ⚙ button" "change it any time in Your plan".
  De uitleg over samen trainen zegt voortaan dat je de week van je maatje op
  "Today" ziet en zijn scores onder "Progress".

### 2.14 Trainingsmodus

Ongewijzigd: klok, repknoppen, pauze en het resultaat per blok.

Eén ding verandert mee: het eindscherm ("Workout done"). Dat toont per oefening
dezelfde regels als 2.5 (reps groot, oordeel eronder) en onder de titel dezelfde
samenvatting als in het log (2.11). Zo ziet het resultaat er vóór en na het
opslaan hetzelfde uit. "Lifted in total" en de knoppen "Save workout" en
"Back to the last exercise" blijven. Bij een oefentraining staan er geen
oordelen.

## 3. Begrippen

- **Training die telt.** Een training met minstens één blok waarin reps zijn
  gedaan, op of na je startdatum. Een training die nog bezig is telt nog niet:
  vandaag gestart en niet afgerond, of op dit toestel nog open.
- **Oefentraining.** Een training met een datum vóór je startdatum. Staat in het
  log als "practice" en telt nergens in mee.
- **Score.** Het resultaat van één oefening in een training die telt: een gewicht
  en een aantal reps.
- **Volledige score.** Een score waarvan het blok de volle tien minuten liep.
  Een blok dat eerder stopte heet "stopped early".
- **Te verslaan score.** De laatste volledige score van een oefening. Is er geen
  volledige, dan de laatste score.
- **Reeks voor Progress.** Alle volledige scores van een oefening, van oud naar
  nieuw. Zijn er geen volledige, dan alle scores.

## 4. Regel: A/B/C loopt door

- De volgende training is de letter ná die van je laatste training die telt.
  "Laatste" is de training met de nieuwste datum. Volgorde: A, B, C, A.
- Heb je nog geen training, dan begin je met A.
- Kies je via "Swap workout" een andere letter, dan loopt de volgorde daarna door
  vanaf die letter.
- Komende trainingsdagen krijgen de letters in die volgorde: de eerstvolgende
  krijgt de volgende letter, de dag daarna de letter daarna (5.4). Zo staan ze
  in de weekstrook en in "Your plan".
- Log je een oude training, dan stelt het blad de letter voor die komt na de
  laatste training tot en met die datum. Je kunt hem aanpassen. Trainingen van
  later houden hun letter.
- De app bewaart geen stand. Verwijder of wijzig je een training, dan volgt de
  volgende letter vanzelf uit wat er dan staat.
- Bij "Same every time" is er geen volgorde.

Dit vervangt de huidige regel, die elke maandag opnieuw bij A begint.

## 5. Regel: de week en verplaatsen

### 5.1 Geplande dagen

- Je vaste dagen staan in je profiel (standaard maandag, woensdag, vrijdag).
- De huidige week kan een eigen lijst dagen hebben. Bestaat die niet, dan gelden
  de vaste dagen. Andere weken volgen altijd de vaste dagen.
- De week loopt van maandag tot en met zondag.
- Een dag is **gepland** als hij in de lijst van die week staat en niet vóór de
  startdatum ligt.
- Uitzondering voor iemands eerste week: een dag van vóór de dag van aanmelden,
  waarop niet getraind is, geldt als rust.
- Een dag is **gemist** als hij gepland was, voorbij is en er geen training is
  die telt.
- Alle andere dagen zijn **rust**.
- Voor een maatje gelden dezelfde regels, met zijn eigen dagen en zijn eigen
  week.

### 5.2 Zelf aanpassen

- In "This week" zet je vandaag en latere dagen aan of uit. Dat schrijft de lijst
  voor deze week. Voorbije dagen en dagen waarop je trainde zijn niet te
  wijzigen.
- Is de lijst gelijk aan je vaste dagen, dan vervalt hij weer.
- Er is geen maximum per week, en nul dagen mag ook. De teller in de weekstrook
  volgt het aantal geplande dagen.
- Alleen de huidige week is aan te passen. Na zondag vervalt de lijst vanzelf.
- Verander je je vaste dagen in "Your plan", dan gaat dat in vanaf vandaag. De
  voorbije dagen van deze week blijven zoals ze waren. Had je de rest van deze
  week zelf aangepast, dan vervalt die aanpassing.

### 5.3 Trainen op een dag die niet gepland is

Sla je een training op die telt, op een dag van de huidige week die niet gepland
was, dan verhuist één geplande dag van die week naar die dag:

1. eerst de vroegste gemiste dag vóór die datum;
2. is die er niet, dan de eerstvolgende geplande dag ná die datum waarop niet
   getraind is;
3. is die er ook niet, dan verhuist er niets en telt de training als extra.

Verhuizen betekent: de dag die verhuist gaat uit de lijst van deze week, de dag
waarop je trainde komt erin.

Voorbeelden met de vaste dagen maandag, woensdag, vrijdag:

| Situatie | Je traint op | Wat er gebeurt |
|---|---|---|
| Maandag gedaan | dinsdag | Woensdag verhuist naar dinsdag. Vrijdag blijft |
| Maandag gemist | dinsdag | Maandag verhuist naar dinsdag. Woensdag en vrijdag blijven |
| Maandag gemist, woensdag gedaan | donderdag | Maandag verhuist naar donderdag. Vrijdag blijft |
| Maandag en woensdag gedaan | donderdag | Vrijdag verhuist naar donderdag |
| Alle drie gedaan | zaterdag | Niets verhuist. De teller wordt "4/3" |

- De regel werkt op drie momenten: als je een training in de trainingsmodus
  afrondt, als je een oude training logt en als je de datum van een training
  wijzigt. Niet als je alleen reps of gewicht aanpast.
- Het gebeurt bij het opslaan, niet bij het starten. Gooi je de training weg, dan
  is er niets verhuisd.
- De regel geldt alleen voor de huidige week en niet voor oefentrainingen.
- Verwijder je later een training waarvoor een dag verhuisde, dan verhuist die
  dag niet vanzelf terug. Dat pas je aan in "This week".
- Train je op een geplande dag, dan telt de training voor die dag. Een eerdere
  gemiste dag blijft dan gemist.

De knop op een rustdag zegt vooraf wat er gaat gebeuren:

| Wat verhuist er | Knop | Regel eronder |
|---|---|---|
| Een gemiste dag | "Train today instead" | "Moves Monday’s workout to today." |
| De eerstvolgende geplande dag | "Train today instead" | "Moves Friday’s workout to today." |
| Niets | "Train anyway" | "Counts as an extra workout this week." |

### 5.4 Komende trainingsdagen

- De volgende trainingsdag is de eerste datum vanaf vandaag die gepland is en
  waarop nog niet getraind is. Heb je vandaag al getraind, dan telt de app vanaf
  morgen.
- Voor de data in "Your plan" zoekt de app zo de eerstvolgende drie
  trainingsdagen, zo nodig over meerdere weken.

## 6. Regel: oefeningen

### 6.1 Hernoemen

- Typ je een andere naam in "Name" en sla je op, dan blijft het dezelfde
  oefening. Scores, gewicht en plek in het schema blijven.
- De nieuwe naam geldt overal: Today, Progress, het log, de trainingsmodus en
  het Excel-bestand.
- Een lege naam kan niet: "Type a name for the exercise."
- Namen zijn uniek. De app weigert een naam die al bij een andere oefening hoort:
  bij een eigen oefening, bij een oefening uit de lijst onder jouw eigen naam, of
  bij een oefening uit de lijst onder zijn oorspronkelijke naam. De melding is
  "You already have an exercise with that name. Switch to it instead."
  Hoofdletters, streepjes en spaties maken daarbij geen verschil.
- Zet je de naam terug naar de oorspronkelijke, dan vervalt je eigen naam.
- Je maatje ziet jouw naam voor jouw oefening.

### 6.2 Soort gewicht

- De soort bepaalt de stapgrootte en hoe je het gewicht invult.
- "Barbell", "One dumbbell" en "Machine / cable" werken hetzelfde: je vult het
  gewicht in dat je tilt. Tussen deze drie kun je altijd wisselen. Alleen de stap
  verandert: 2,5 kg bij barbell, 2 kg bij één dumbbell, 5 kg bij machine.
- "Dumbbells (pair)" vul je per dumbbell in. "Bodyweight" vul je in als extra
  gewicht. Van of naar deze twee wisselen kan alleen zolang de oefening nog geen
  scores heeft. Het gewicht begint dan op het startgewicht van de nieuwe soort.
- Heeft de oefening scores, dan zijn de knoppen die niet kunnen uitgeschakeld,
  met eronder "Different kind of weight? Switch to another exercise."
- Dit geldt voor oefeningen uit de lijst en voor eigen oefeningen. Verander je de
  soort van een oefening uit de lijst niet, dan houdt hij zijn eigen stap.

### 6.3 Geen stille omzetting

- De app verandert een getypte naam nooit in een andere naam.
- Zoeken in de keuzelijst vindt een oefening op zijn naam, op zijn oorspronkelijke
  naam als je hem hernoemde, en op bekende andere namen. Wie "shoulder press"
  zoekt, ziet "Overhead press" als resultaat. Kiezen blijft een tik van jou.
- "Add exercise" maakt een nieuwe oefening met precies de naam die je typt.
  Bestaat die naam al (dezelfde regel als in 6.1), dan weigert de app:
  "You already have an exercise with that name. Pick it from the list."
- De suggestielijst onder tekstvelden verdwijnt.

### 6.4 Uitleg per groep

| Groep | Tekst |
|---|---|
| Push | "You press the weight away from you. Trains chest, shoulders and triceps." |
| Pull | "You pull the weight toward you. Trains back and biceps." |
| Legs | "You push with your legs or bend at the hips. Trains thighs, hamstrings and glutes." |

In de app staat de naam van de groep ervoor, met het gekleurde schijfje:
"Push: you press the weight away from you. …"

De uitleg staat op drie plekken: bovenaan de keuzelijst (alleen die groep),
onderaan "Your plan" (alle drie) en onder "How 3-3-30 works" in "Settings".

## 7. Gegevens

Het profiel krijgt drie nieuwe, optionele velden. Trainingen veranderen niet.

| Veld | Inhoud | Voorbeeld |
|---|---|---|
| `names` | Eigen naam voor een oefening uit de lijst | `{ "schouderdrukken": "Shoulder press" }` |
| `eqs` | Andere soort gewicht voor een oefening uit de lijst | `{ "schouderdrukken": "machine" }` |
| `week` | De eigen lijst dagen van één week | `{ "mon": "2026-10-12", "days": [1, 2, 5] }` |

- `names`: maximaal 40 tekens per naam. Een eigen oefening bewaart zijn naam
  zoals nu in `custom`.
- `eqs`: één van `barbell`, `dbpair`, `db`, `machine`, `bw`. Een eigen oefening
  bewaart zijn soort zoals nu in `custom`.
- De gegevens van een oefening uit de lijst zijn: de lijst, met daaroverheen
  `names` en `eqs`. Bij een andere soort horen de stap en de manier van invullen
  van die soort.
- `week`: `mon` is de maandag van de week, `days` zijn dagnummers 0 (zondag) tot
  en met 6 (zaterdag). Het veld telt alleen als `mon` de maandag van de huidige
  week is. Bij het opslaan van het profiel wordt een verlopen `week` weggelaten.
- Ontbreekt een veld, dan werkt alles als voorheen. Bestaande profielen hoeven
  niet omgezet te worden.
- De controle bij het inlezen (`normProfile`) kent de drie velden en gooit
  ongeldige waarden weg.
- De back-up bevat de nieuwe velden. Een oude back-up zonder die velden blijft
  te herstellen. Zet je een back-up terug in een log dat al trainingen heeft, dan
  blijven je huidige schema en namen staan, zoals nu.
- De Firestore-regels veranderen niet. De groepscode blijft alleen in Firebase.

## 8. Wat verdwijnt of verhuist

- De A/B/C-knoppen op de hoofdkaart: vervangen door "Swap workout".
- De regel "elke maandag begint bij A".
- De voortgangskaarten met twee grafieken per groep op de hoofdpagina. De
  grafieken zelf blijven en staan in de historie van een oefening.
- De logtabel met kilo's als hoofdgetal.
- Vrije tekstvelden voor oefeningnamen met automatische omzetting, en de
  suggestielijst daaronder.
- "Training days" in "Settings": verhuist naar "Your plan".
- "Log a past workout" op de hoofdkaart: verhuist naar "Progress".
- De regel "x of 3 this week" boven de titel: vervangen door de weekstrook.

## 9. Techniek

- De bron blijft één bestand: `3-3-30/index.html`. `python3 3-3-30/build_web.py`
  bouwt daaruit `docs/index.html` voor de website. `docs/claude-shim.js`
  verandert niet.
- Geen nieuwe bibliotheken. Alle nieuwe onderdelen gebruiken de bestaande
  kleuren en letters, dus ook de donkere weergave werkt.
- De regels uit 3 tot en met 6 komen in losse, kleine functies zonder
  schermcode: welke trainingen tellen, volgende letter, geplande dagen van een
  week, weekmodel per persoon, welke dag verhuist, komende trainingsdagen met
  letters, naamcontrole, welke soorten gewicht mogen, oordeel per oefening,
  samenvatting per training en de regel voor "Your scores". De schermen lezen
  alleen uit die functies.
- Bladen: het blad "Exercise" wisselt binnen hetzelfde blad naar de keuzelijst
  en terug. Er komen geen bladen boven op elkaar.
- Wat nu goed werkt voor toetsenbord en schermlezer blijft: knoppen met een
  naam, de focus terug na het sluiten van een blad, tikvlakken van minstens
  44 pixels.
- Dit ontwerp en het bouwplan staan in `superpowers/`, niet in `docs/`, omdat
  `docs/` de map is die als website online staat.

### Testen

- Er komt een testmap met Playwright-tests die `3-3-30/index.html` in Chromium
  openen met een vaste datum. Ik draai ze hier tijdens het bouwen; er komt geen
  automatische controle op GitHub.
- Regels voor één persoon draaien in de modus zonder gedeelde opslag. Voor het
  maatje krijgt de pagina een nagemaakte opslag in het geheugen.
- Getest wordt in elk geval: de A/B/C-volgorde, het weekmodel en de teller, de
  verhuisregel met de vijf voorbeelden uit 5.3, het aanpassen van de week en van
  de vaste dagen, hernoemen met behoud van scores, unieke namen, de beperking op
  soort gewicht, zoeken zonder omzetting, de vijf situaties van Today, het
  oordeel per oefening en per training, de regels van "Your scores", een oud
  profiel zonder nieuwe velden, en back-up maken en terugzetten.
- Elke regel krijgt eerst een falende test, daarna de code.
- Voor oplevering loop ik de schermen na op telefoonbreedte, licht en donker.

## 10. Bouwvolgorde

Elke stap is af en bruikbaar voordat de volgende begint.

1. Regels en gegevens: begrippen, doorlopende A/B/C, weekmodel, verhuisregel, de
   drie nieuwe velden, met tests. Zichtbaar verandert alleen de volgorde.
2. Schakelaar onderin en Today: weekstrook, grote doelen, de vijf situaties.
   Progress toont voorlopig de bestaande inhoud.
3. "Your plan", "This week" en verplaatsen.
4. "Exercise", de keuzelijst, de uitleg per groep en de keuzelijst in het
   logblad.
5. Progress: weekkaart, scores, log, historie van een oefening, weergave van een
   maatje.
6. Opruimen van oude schermcode, `docs/` opnieuw bouwen, `SETUP.md` en `README`
   bijwerken, online zetten.

## 11. Aannames en risico's

- Meer dan drie maatjes in de weekstrook komt zelden voor. De rest staat achter
  "+n more".
- Niemand hoeft een andere week dan de huidige vooruit te plannen.
- Een training op een niet-geplande dag is bedoeld als verplaatsing, niet als
  vierde training. Wie wel een vierde wil, zet in "This week" een dag extra aan.
- Alleen de website wordt bijgewerkt. De versie in Claude blijft staan zoals hij
  is. Het bronbestand blijft voor beide geschikt, dus bijwerken kan later alsnog.
- Staat de oude pagina nog ergens open en sla je daar iets in je profiel op
  (bijvoorbeeld een gewicht), dan wist die oude pagina `names`, `eqs` en `week`.
  Scores en trainingen blijven altijd staan; een eigen naam of een aangepaste
  week moet je dan opnieuw instellen. Na het online zetten laadt iedereen de
  pagina één keer opnieuw.
