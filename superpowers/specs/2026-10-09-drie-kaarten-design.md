# 3-3-30 Log: drie kaarten

Datum: 9 oktober 2026
Status: akkoord op 9 oktober 2026. Bouwplan: `superpowers/plans/2026-10-09-drie-kaarten.md`

De schermontwerpen staan op de eerste pagina van het canvas "3-3-30 Log
eenvoudiger: 3 opties". Dit document legt vast wat er gebouwd wordt en volgens
welke regels. Waar het canvas en dit document verschillen, geldt dit document.
Teksten tussen "aanhalingstekens" zijn de Engelse teksten in de app.

Dit ontwerp bouwt voort op het herontwerp van 8 oktober
(`2026-10-08-herontwerp-design.md`). Wat hier niet genoemd wordt, blijft werken
zoals het nu werkt.

## 1. Doel

De app is nog te ingewikkeld. Het moet in één keer duidelijk zijn wat wat doet,
hoe je het gebruikt en waar elke knop voor is.

De app doet daarom nog drie dingen:

1. Laten zien welke drie oefeningen je vandaag doet en wat je moet verslaan.
2. Per oefening tien minuten aftellen en je reps bijhouden.
3. Laten zien of je beter wordt.

Uitgangspunten:

- Eén beginscherm. Elke oefening is een kaart met een eigen knop.
- De knop zegt wat er gebeurt. Na "Start 10 minutes" wordt de knop zelf de klok.
- Niets plannen. Er zijn geen vaste trainingsdagen meer.
- Geen knoppen met alleen een icoontje en geen schakelaars zonder uitleg.
- Niets apart opslaan. Een score staat erin zodra de klok stopt.

### Gekozen richting

| Onderwerp | Keuze |
|---|---|
| Indeling | Eén beginscherm met drie kaarten. Daarnaast twee schermen met een terugknop: "My results" en "Settings" |
| Trainen | De klok loopt op de knop van de kaart. Er is geen apart trainingsscherm meer |
| Volgorde | Vrij: je start de oefening die je wilt |
| Week | Een teller: 3 trainingen per week, op welke dag je wilt |
| Oefeningen | Steeds dezelfde drie. Wisselen tussen A, B en C staat uit en kan aan in "Settings" |
| Resultaten | Eén tabel met je trainingen, en per oefening een grafiek van je reps |
| Gewicht | Zet je vóór de start, via "Change" |

### Niet in dit ontwerp

- Meldingen of herinneringen.
- Andere talen.
- Het gewicht wisselen terwijl de klok loopt.
- Een tweede training op dezelfde dag via de kaarten. Met de hand toevoegen kan.
- Kilo's getild op het scherm. Ze staan nog in het Excel-bestand.

### Verschillen met de tekeningen

- Het aftellen vóór de klok ("Get ready") en de knop "Cancel" zijn niet getekend
  (2.4).
- De cijfers op de knop zijn de bestaande ledcijfers. De tekening toont gewone
  cijfers (2.4).
- Naast het totaal staat "✓ Past last time (62)" zodra je de te verslaan score
  voorbij bent (2.4). Niet getekend.
- Het resultaatvak is alleen groen bij een verbetering of een eerste score (2.5).
- Onder "Done for today" staat het korte oordeel ("3 of 3 beaten."), niet de zin
  van de tekening (2.2).
- De hint "Something wrong? …" staat er zodra één oefening klaar is, niet pas bij
  alle drie (2.2).
- De tabel toont eerst zes trainingen; de tekening toont er vier (2.8).
- Rechtsboven in "My results" staat geen naam (2.8).
- Een gewichtswissel is in de grafiek gemerkt met een lijntje (2.8). Niet
  getekend.
- "Train with a buddy" en "How 3-3-30 works" klappen open op hun plek; de
  tekening toont pijltjes (2.9).

## 2. Schermen

### 2.1 Navigatie

- Er is één hoofdscherm: het beginscherm met de drie kaarten.
- "My results" en "Settings" zijn eigen schermen. Bovenaan staat de knop "Back",
  die teruggaat naar het beginscherm. De terugknop van de telefoon of de browser
  doet hetzelfde.
- De schakelaar onderin ("Today" en "Progress") verdwijnt.
- Bladen van onderaf blijven voor wat je zelden doet: "Exercise" (via "Change"),
  een training toevoegen of verbeteren, een training van je maatje bekijken en
  "Swap workout" (alleen met A, B en C aan). Er ligt nooit meer dan één blad
  open.
- Na opnieuw laden sta je op het beginscherm.

### 2.2 Beginscherm

Van boven naar beneden:

1. Bovenbalk: het logo links, de datum van vandaag rechts ("Fri 9 Oct"). Staat
   het log alleen op dit toestel, dan staat er "Fri 9 Oct · this device only".
   Het tandwiel verdwijnt.
2. De titel met één zin eronder.
3. Drie kaarten, altijd in de volgorde push, pull, legs (2.3).
4. De hint "Something wrong? Tap an exercise to fix its reps." Alleen als er
   vandaag een oefening klaar is.
5. De weekteller (2.6).
6. Twee knoppen naast elkaar: "My results" en "Settings".

De titel volgt hoeveel oefeningen van de training van vandaag (3) klaar zijn:

| Klaar vandaag | Titel | Zin |
|---|---|---|
| Geen | "Today: 3 exercises" | "Each one takes 10 minutes. Do them in any order and beat your last score." |
| Eén | "Two to go" | "One done. Start the next one when you are ready." |
| Twee | "One to go" | "Two done. Start the last one when you are ready." |
| Alle drie | "Done for today" | Het oordeel over de training in het kort (3), met een punt erachter: "3 of 3 beaten." |

Is er een kaart open (2.4 en 2.5), dan verdwijnen de titel, de hint, de
weekteller en de twee knoppen. Je ziet dan alleen de bovenbalk en de kaarten. Zo
past de open kaart met de toetsen op één scherm van een gewone telefoon
(390 × 844).

Meldingen van de app (bijvoorbeeld dat bewaren in het gedeelde log niet lukt)
blijven boven de titel staan zoals nu.

### 2.3 Een kaart

Een kaart heeft één van vier vormen.

| Vorm | Wanneer | Wat je ziet |
|---|---|---|
| Te doen | De oefening is vandaag nog niet gedaan en er is geen kaart open | Schijfje, groep, naam, gewicht, het doel, de knoppen "Start 10 minutes" en "Change" |
| Open | Van deze oefening loopt het aftellen of de klok, staat de klok op pauze of is de tijd net om | Zie 2.4 en 2.5 |
| Wacht | De oefening is nog niet gedaan en een andere kaart is open | Eén regel: schijfje, naam, eronder "Pull · 65 kg · still to do", rechts "To beat 77". Geen knoppen |
| Klaar | De oefening is vandaag gedaan | Groen vinkje, "Push · done", naam, gewicht, de reps groot en het oordeel eronder |

**Te doen**

- Links het gekleurde schijfje van de groep (rood push, blauw pull, geel legs).
  Boven de naam staat de groep in woorden: "Push", "Pull" of "Legs".
- Onder de naam het gewicht ("35 kg", "2 × 10 kg", "bodyweight").
- Rechts het doel: het aantal reps van de te verslaan score (3) met erboven
  "To beat". Is het ingestelde gewicht zwaarder dan dat van die score, dan staat
  er "To match". Heeft de oefening nog geen score, dan staat er "First time".
- De eerste kaart die nog te doen is heeft de zwarte knop. De andere hebben een
  knop met alleen een rand. Ze doen hetzelfde.
- De tip om zwaarder te gaan blijft, boven de knoppen: "… went well. Go up to
  37.5 kg?" met "Yes" en "Not now".
- "Change" opent het blad "Exercise" (2.7).
- De kaart toont de oefening en het gewicht uit je schema. Die liggen vast voor
  deze poging op het moment dat je op "Start 10 minutes" tikt.

**Klaar**

- Het gewicht is het gewicht waarmee je de oefening deed.
- Het oordeel vergelijkt met de te verslaan score van vóór de training van
  vandaag:

| Geval | Tekst |
|---|---|
| Eerste score van deze oefening | "first score" |
| Zelfde gewicht, meer reps | "▲ 6 more" (groen) |
| Zelfde gewicht, evenveel reps | "same as last time" |
| Zelfde gewicht, minder reps | "▼ 3 fewer" |
| Zwaarder dan de te verslaan score | "+2.5 kg" |
| Lichter dan de te verslaan score | "−2.5 kg" |
| Gestopt vóór de tien minuten | "stopped early" |

- Stopte de klok vóór de tien minuten, dan geldt alleen de laatste regel van de
  tabel.
- De hele kaart is een knop. Tik erop en het blad "Edit workout" opent met de
  training van vandaag (2.10). Zolang een andere kaart open is, doet een tik
  niets.

### 2.4 De klok op de knop

Tik op "Start 10 minutes". De kaart gaat open en blijft open tot je op "Done"
tikt (2.5). De andere kaarten die nog te doen zijn worden een regel ("Wacht").
De knop zelf verandert zo:

| Stap | Op de knop | Onder de knop |
|---|---|---|
| Aftellen | Een groot getal dat van 10 naar 1 telt, oranje. Eronder "Get ready · tap to start now" | De tekstknop "Cancel". De toetsen staan er al, grijs, en doen nog niets |
| De klok loopt | De tijd die over is, bijvoorbeeld "06:42", rood; de laatste tien seconden oranje. Een dunne balk loopt vol. Eronder "Tap to pause or stop" | Het totaal ("23 reps so far"), de zin "After each set, tap how many reps you did.", de toetsen en je sets |
| Pauze | Dezelfde tijd, oranje, staat stil. Eronder "Paused · tap to go on" | De knoppen "Stop and save" en "Throw away", het totaal, de toetsen en je sets |

De knop staat in alle stappen op de plek van "Start 10 minutes" en is zo breed als
de kaart, zoals getekend; "Change" staat er dan niet. Hij is hoger, zodat de
cijfers van een afstand te lezen zijn. De cijfers zijn de bestaande ledcijfers
van de klok.

**Aftellen**

- Alleen als "Countdown" aan staat (2.9). Staat het uit, dan loopt de klok
  meteen.
- Tik op de knop: de klok start direct.
- "Cancel": de kaart gaat dicht. Er is niets gebeurd en niets bewaard.

**Reps intikken**

- De toetsen zijn de getallen 1 tot en met 20. Eén tik is één set met zoveel
  reps. Het totaal telt op.
- Onder de toetsen staan je sets ("Your sets: 8 8 7") en "Undo last set". Die
  haalt de laatste set weg.
- Kom je boven de te verslaan score, dan staat er naast het totaal in groen
  "✓ Past last time (62)" en trilt de telefoon kort, zoals nu.

**Pauze en stoppen**

- Tik op de klok: pauze. Nog een tik: de klok loopt verder. Op pauze kun je sets
  intikken en weghalen.
- "Stop and save": de oefening stopt nu. Je reps tot dan toe zijn je score, met
  het label "stopped early" (3). Daarna volgt 2.5. Zonder reps kan dit niet; de
  app zegt dan "Nothing to save yet."
- "Throw away": de knop zegt eerst "Tap again to throw away". Tik je binnen
  3,5 seconde nog een keer, dan gaat de kaart dicht en is er van deze poging
  niets bewaard.

**Geluid en scherm**

- De piepjes en het trillen blijven zoals nu: drie korte piepjes aan het eind
  van het aftellen, één bij de start, één bij 5 minuten, twee bij 1 minuut, drie
  korte in de laatste seconden en een lange aan het eind. Staat "Beeps" uit
  (2.9), dan piept er niets.
- Het scherm blijft aan zolang het aftellen of de klok loopt.
- Het geluidsknopje op het trainingsscherm verdwijnt. Geluid zet je aan of uit in
  "Settings".

De regels van de klok staan in 4.2.

### 2.5 Na de tien minuten

Bij 0:00, of na "Stop and save", maakt de klok plaats voor het resultaat. De
kaart toont dan van boven naar beneden:

1. Een vak met "Time is up" (of "Stopped early"), het totaal groot met "reps"
   erachter, en het oordeel in een zin:

| Geval | Zin |
|---|---|
| Eerste score van deze oefening | "First score. Next time, beat this." |
| Zelfde gewicht, meer reps | "▲ 6 more than last time" |
| Zelfde gewicht, evenveel reps | "Same as last time" |
| Zelfde gewicht, minder reps | "▼ 3 fewer than last time" |
| Zwaarder dan de te verslaan score | "Heavier than last time: +2.5 kg" |
| Lichter dan de te verslaan score | "Lighter than last time: −2.5 kg" |
| Gestopt vóór de tien minuten | "It counts, but it is not your next score to beat." |

   Stopte de klok vóór de tien minuten, dan geldt alleen de laatste regel. Het
   vak is groen bij een eerste score en bij meer reps. Anders is het grijs.

2. Eén regel over het bewaren: "Your score is saved. Last set not in yet? Tap it
   now." Tijdens het bewaren staat er "Saving…". Lukt het niet, dan staat er
   "Not saved yet. Tap Done to try again."
3. De toetsen, je sets en "Undo last set".
4. De knop "Done".

- De score wordt bewaard op het moment dat de tijd om is (4.3). Elke set die je
  daarna intikt of weghaalt, wordt ook bewaard. Het totaal en het oordeel in het
  vak volgen mee.
- "Done" sluit de kaart. Hij krijgt de vorm "Klaar". Was het bewaren niet gelukt,
  dan probeert "Done" het opnieuw en blijft de kaart open tot het lukt.
- Staan er geen reps, dan staat er "No reps logged." in plaats van het oordeel en
  bewaart de app niets. "Done" zet de kaart dan terug op "Te doen".

### 2.6 Weekteller

Eén kaart onder de oefeningen: "This week", drie rondjes en een tekst.

- Een gevuld rondje is een training die telt in deze week (3). De week loopt van
  maandag tot en met zondag.
- De tekst is "0 of 3 workouts", "1 of 3 workouts", tot en met
  "3 of 3 workouts". Doe je er meer, dan blijven de drie rondjes gevuld en staat
  er "4 workouts this week".
- Er zijn geen dagen, geen gemiste dagen en geen rustdagen meer.
- Heb je een maatje, dan heeft de kaart een regel per persoon: eerst "You", dan
  maximaal drie maatjes in volgorde van aanmelden, elk met naam, drie rondjes en
  "2 of 3". Zijn er meer maatjes, dan staat er "+2 more"; die regel opent
  "My results".

### 2.7 Change

"Change" opent het bestaande blad "Exercise" voor de oefening van die kaart:
naam, soort gewicht, gewicht, "Score to beat", "Save" en "Switch to another
exercise" met de keuzelijst en "Add your own exercise". Het blad werkt zoals nu.

- De kop toont de groep ("Push"). Met A, B en C aan ook de training
  ("Push · Workout B").
- Sluiten of opslaan gaat altijd terug naar het beginscherm. De weg terug naar
  "Your plan" vervalt, want dat blad verdwijnt.

### 2.8 My results

Van boven naar beneden:

1. De knop "Back".
2. De titel "My results" en de zin "Your workouts, newest first. The numbers are
   your reps in 10 minutes."
3. Heb je een maatje: de knoppen "Me" en de namen van je maatjes. Je kiest
   daarmee wiens resultaten je ziet.
4. De tabel met trainingen.
5. De uitleg "▲ means you beat your last score. Tap a day to see or fix that
   workout."
6. De kop "Charts" met de zin "Your reps per workout, one chart for each
   exercise."
7. De kaart met drie grafieken.
8. De hint "Tap a point in a chart to see that day.", alleen als er een lijn
   getekend is.
9. De knop "Add a workout by hand" (2.10).

**De tabel**

- Vier kolommen: "Day", push, pull en legs. In de kop van een oefenkolom staan
  de groep, de naam van de oefening die nu in je schema staat en het ingestelde
  gewicht.
- Eén rij per training, nieuwste boven: alle trainingen die tellen en de
  oefentrainingen (3). Een oefentraining heeft onder de datum het woord
  "practice".
- In een cel staat het aantal reps. Had je meer reps dan de te verslaan score
  op hetzelfde gewicht, dan staat er een groen "▲" achter.
- Een oefening die je die dag niet deed is een streepje.
- Deed je die dag in die groep een andere oefening dan die in de kop, dan staat
  er een sterretje achter het getal. Onder de tabel staat dan
  "* another exercise that day".
- De tabel toont eerst zes trainingen. Zijn er meer, dan staat eronder
  "Show all 14 workouts".
- Tik op een rij van jezelf: het blad "Edit workout" opent (2.10). Tik op een rij
  van je maatje: het leesblad opent, zoals nu.
- Zonder trainingen staat er "No workouts yet." en ontbreken de uitleg, de kop
  "Charts", de grafieken en de hint.

**De grafieken**

- Eén kaart met drie grafieken onder elkaar: push, pull, legs. Elke grafiek hoort
  bij de oefening die nu in je schema staat.
- Boven een grafiek: het schijfje, de naam, eronder de groep en het ingestelde
  gewicht ("Push · 35 kg"), en rechts de laatste score ("72 reps now").
- De lijn toont de reps per training uit de reeks van die oefening (3), van oud
  naar nieuw, met een punt per training. Het laatste punt is iets groter.
- Links staan drie of vier ronde getallen als schaal. Onderaan staan de eerste en
  de laatste datum.
- Tik op een punt: een label toont de reps, het gewicht en de datum van die
  training. Met het toetsenbord gaat dat met de pijltjes, zoals nu.
- Is het gewicht van een punt anders dan dat van het punt ervoor, dan staat bij
  dat punt een dun verticaal lijntje met het nieuwe gewicht erboven. Zo zie je
  dat minder reps bij een zwaarder gewicht horen.
- Met één score staat er in plaats van de lijn "The line starts the 2nd time."
  Zonder score staat er "No score yet."
- De grafieken gebruiken de bestaande tekencode en kleuren, dus ook de donkere
  weergave werkt.

**Bij een maatje** zie je hetzelfde scherm met zijn gegevens. De titel is dan
"Sam’s results" en de uitleg "▲ means Sam beat the last score. Tap a day to see
that workout." De zin onder de titel is "Sam’s workouts, newest first. The
numbers are the reps in 10 minutes." en die boven de grafieken "Sam’s reps per
workout, one chart for each exercise." De knop "Add a workout by hand" ontbreekt.
Heeft hij nog niets gelogd, dan staat er "Sam hasn’t logged a workout yet."

### 2.9 Settings

Een scherm met de knop "Back". Elke regel zegt in woorden wat hij doet.

| Kop | Regels |
|---|---|
| "Your name" | Een tekstveld met je naam. Bewaart bij het verlaten van het veld, zoals nu |
| "Your exercises" | Twee keuzes onder elkaar, waarvan er één gekozen is: "The same 3 exercises every workout" met eronder "You do your own three every time." en "3 workouts that take turns" met eronder "Workout A, B and C, each with its own three exercises." |
| "Sound and countdown" | "Beeps" met eronder "At the start, with 5 and 1 minute to go, and at the end." en "Countdown" met eronder "10 seconds to get ready before the clock starts." Rechts van elk een knop die de stand toont: "On" met een vinkje, of "Off". Een tik wisselt de stand |
| "Backup" | "Save a backup" met eronder "A file with all your workouts", "Restore a backup" met eronder "Put back a file you saved before", en "Open in Excel" met eronder "All your workouts as a .csv file" |
| "More" | "Train with a buddy", "How 3-3-30 works" en, alleen op de website, "Sign out" met eronder "Signed in as …" |

- De eerste keuze bij "Your exercises" is de standaard (2.12 en 5).
- "Beeps" en "Countdown" gelden per toestel, zoals nu.
- De drie regels onder "Backup" doen wat de drie bestaande knoppen doen.
- "Train with a buddy" en "How 3-3-30 works" klappen open op hun plek en tonen de
  bestaande teksten, met de uitleg van push, pull en legs. In de tekst over het
  maatje staat voortaan dat je zijn week op het beginscherm ziet en zijn scores
  onder "My results".
- Staat het log alleen op dit toestel, dan staat onderaan "Your workouts are
  saved on this device only."

### 2.10 Een training toevoegen of verbeteren

Het bestaande blad blijft. Het opent op drie manieren: "Add a workout by hand" in
"My results", een tik op een rij in de tabel, en een tik op een kaart die klaar
is.

- De titel van het blad voor een nieuwe training wordt "Add a workout".
- De snelle datumkeuze toont alleen "Today" en "Yesterday". De voorstellen voor
  gemiste trainingsdagen vervallen.
- De keuze "Workout A, B, C" in het blad staat er alleen met A, B en C aan.
- Na het opslaan verhuist er niets meer.
- Laat je de reps van een oefening leeg, dan is die oefening niet gedaan. In de
  training van vandaag wordt die kaart dan weer "Te doen".
- De vraag "Use these from now on?" en "Delete this workout" blijven.

### 2.11 Welkom

Het welkomscherm blijft, met andere tekst:

- Onder de titel: "Each workout is three 10-minute blocks: push, pull, legs. Do
  as many clean reps as you can, and beat it next time." De zin over je startdag
  vervalt.
- Onder de knop "Let’s go": "You start with three standard exercises. Tap Change
  on a card to pick your own." Staat het log alleen op dit toestel, dan volgt
  "Your workouts are saved on this device."
- "Restore a backup" blijft.

### 2.12 Met A, B en C aan

Kies je in "Settings" voor "3 workouts that take turns", dan:

- is de titel van het beginscherm "Today: Workout B" in plaats van
  "Today: 3 exercises". De zin eronder blijft gelijk;
- staat onder die zin de tekstknop "Do another workout". Die opent het bestaande
  blad "Swap workout". De knop is weg zodra er vandaag een oefening klaar is of
  een kaart open is;
- loopt de volgorde door zoals nu: na A komt B, na B komt C;
- staan in "My results" boven de tabel de knoppen "Workout A", "Workout B" en
  "Workout C". De tabel en de grafieken tonen die training. Standaard staat de
  training die aan de beurt is. Heb je een training nog nooit gedaan, dan staat
  er in de tabel "No Workout B yet."

De oefeningen van B en C pas je aan op het beginscherm, op een dag dat die
training aan de beurt is of na "Do another workout".

## 3. Begrippen

- **Training van vandaag.** De nieuwste training met de datum van vandaag. Is die
  er niet, dan maakt de app hem aan zodra je eerste score van vandaag bewaard
  wordt. De kaarten schrijven in deze training.
- **Training die telt.** Een training met minstens één oefening waarin reps zijn
  gedaan, op of na je startdatum. Een training telt dus vanaf de eerste oefening
  die klaar is.
- **Startdatum.** De maandag van de week waarin je voor het eerst meedoet. Voor
  wie al meedoet geldt zijn bestaande startdatum, of die maandag als die eerder
  is.
- **Oefentraining.** Een training met een datum vóór je startdatum. Dat kan
  alleen nog als je een oude training met de hand toevoegt. Hij staat in de tabel
  met "practice" en telt nergens in mee.
- **Score.** Het resultaat van één oefening in een training die telt: een gewicht
  en een aantal reps.
- **Volledige score.** Een score waarvan de klok de volle tien minuten liep. Een
  score die eerder stopte heet "stopped early".
- **Te verslaan score.** De laatste volledige score van een oefening. Is er geen
  volledige, dan de laatste score.
- **Reeks.** Alle volledige scores van een oefening, van oud naar nieuw. Zijn er
  geen volledige, dan alle scores.
- **Oordeel over de training in het kort.** De bestaande samenvatting:
  "2 of 3 beaten", "2 of 2 beaten · 1 heavier", "3 first scores", "1 stopped
  early". De regels daarvoor veranderen niet.

## 4. Regels

### 4.1 De week

- De weekteller telt de trainingen die tellen met een datum in de huidige week,
  van maandag tot en met zondag.
- Twee trainingen op één dag zijn twee trainingen.
- Het doel is altijd drie. Het is niet in te stellen.

### 4.2 De klok

- Er is nooit meer dan één kaart open. Zolang er een open is, kun je geen andere
  oefening starten en zijn "My results" en "Settings" niet te bereiken.
- De klok rekent met de echte tijd. Ga je even naar een andere app of valt het
  scherm uit, dan loopt de tijd door. Kom je terug na de tien minuten, dan is de
  tijd om en zie je 2.5 met de sets die je had ingetikt. Piepjes klinken alleen
  als de app in beeld is, zoals nu.
- Laad je de pagina opnieuw terwijl de klok loopt, op pauze staat of de tijd om
  is, dan opent dezelfde kaart weer in dezelfde stand. Tijdens het aftellen
  herladen zet de kaart terug op "Te doen".
- Op pauze staat de tijd stil, ook als je de app sluit.
- De oefening en het gewicht liggen vast vanaf de start. Wil je toch een ander
  gewicht, dan gooi je de poging weg ("Throw away"), pas je het gewicht aan met
  "Change" en start je opnieuw.
- Is een kaart op een eerdere dag open blijven staan, dan sluit de app die kaart
  af zodra je de app weer opent: de reps die erin staan tellen als score voor
  die dag. Liep de
  klok geen volle tien minuten, dan is het "stopped early". Stonden er geen reps
  in, dan vervalt de poging. De kaarten van vandaag beginnen schoon.

### 4.3 Bewaren

- Een score wordt bewaard zodra de tijd om is of na "Stop and save". De app
  schrijft hem in de training van vandaag (3) en bewaart die training. Er is
  geen knop "Save workout" meer.
- Elke wijziging daarna (een laatste set, "Undo last set") bewaart opnieuw.
- Het ingestelde gewicht van de oefening wordt het gewicht van deze score, zoals
  nu na een training.
- Lukt bewaren in het gedeelde log niet omdat het niet mag, dan bewaart de app op
  dit toestel en toont hij de bestaande melding, zoals nu.
- Lukt bewaren om een andere reden niet, dan blijft de kaart open met "Not saved
  yet. Tap Done to try again." De poging staat veilig op dit toestel tot het
  lukt, ook na opnieuw laden.
- Een oefening die je vandaag niet doet, staat in de training als niet gedaan.
  Er is geen knop "Skip" meer: je start hem gewoon niet.

### 4.4 Wat de kaarten tonen

- Een kaart die nog te doen is toont wat in je schema staat: de oefening van die
  groep en het ingestelde gewicht. Verander je iets met "Change", dan verandert
  de kaart mee.
- Een kaart die klaar is toont wat je deed, ook als je daarna je schema
  verandert.
- Voeg je vandaag met de hand een training toe, dan is dat de training van
  vandaag en volgen de kaarten die.

## 5. Gegevens

Het profiel krijgt één nieuw, optioneel veld. Trainingen houden hun vorm.

| Veld | Inhoud | Voorbeeld |
|---|---|---|
| `rotate` | `true` als A, B en C om de beurt gaan | `true` |

- Ontbreekt `rotate`, dan doe je steeds dezelfde drie oefeningen: die van
  Workout A in je profiel. Voor Steef zijn dat zijn eigen drie. Er wordt bij het
  bijwerken niets omgezet of overschreven.
- De app leest het oude veld `mode` niet meer, maar schrijft het nog wel mee
  (`abc` als `rotate` aan staat, anders `same`), zodat een oude pagina hetzelfde
  ziet.
- De velden `days` en `week` gebruikt de app niet meer. Ze blijven in bestaande
  profielen staan en worden niet gewist.
- De controle bij het inlezen (`normProfile`) kent `rotate` en gooit elke andere
  waarde dan `true` weg.
- Een training kan nu één of twee gedane oefeningen hebben terwijl je nog bezig
  bent. Zijn status is "klaar" zodra de eerste score bewaard is. De bestaande
  controle bij het inlezen (`normSession`) verandert niet.
- Op het toestel bewaart de app de open kaart: welke oefening, de stand van de
  klok en de sets. Stond er bij het bijwerken nog een training open van de oude
  versie, dan blijft die bewaard: wat gedaan is telt, de rest vervalt.
- De back-up bevat het nieuwe veld. Een oude back-up blijft terug te zetten.
- De Firestore-regels veranderen niet. De groepscode blijft alleen in Firebase.

## 6. Wat verdwijnt

- Vaste trainingsdagen, de weekstrook met dagrondjes, het blad "This week" met
  de schakelaars, gemiste dagen, rustdagen en het verplaatsen van een training.
- Het blad "Your plan". Oefeningen pas je aan vanaf de kaart.
- De schakelaar "Today" en "Progress" onderin, en het scherm "Progress" met de
  weekkaart, "Your scores" met de lijntjes en het log. "My results" komt ervoor
  in de plaats.
- Het blad met de historie van één oefening. De grafieken staan nu in
  "My results".
- Kilo's getild op het scherm: per week, per training ("Lifted in total") en als
  grafiek. Ze staan nog in het Excel-bestand.
- Het aparte trainingsscherm: "Block 1 of 3", het kruisje met het menu ("Keep
  going", "Finish later", "Stop and save what I did", "Discard workout"), "Skip
  this exercise", "End block", "Next: Pull →", het eindscherm "Workout done" met
  "Save workout", en "Resume workout" en "Discard it" op het beginscherm.
- Het gewicht aanpassen tijdens de klok, en daarmee verschillende gewichten
  binnen één oefening. Oude trainingen waarin dat voorkomt blijven zoals ze zijn.
- De titels "New PR!" na een blok.
- "Train again today".
- De oefentraining vóór je startdatum ("Get ready", "Try a practice workout").
- Het tandwiel en het geluidsknopje.

## 7. Techniek

- De bron blijft één bestand: `3-3-30/index.html`. `python3 3-3-30/build_web.py`
  bouwt daaruit `docs/index.html` voor de website. `docs/claude-shim.js`
  verandert niet.
- Geen nieuwe bibliotheken. Alle nieuwe onderdelen gebruiken de bestaande kleuren
  en letters, dus ook de donkere weergave werkt.
- De klok houdt zijn bestaande rekenwerk (starttijd, pauzetijd, piepjes, scherm
  aan). Alleen de plek waar hij getekend wordt verandert: in de kaart in plaats
  van op een eigen scherm.
- De regels uit 3 en 4 komen in kleine functies zonder schermcode: de training
  van vandaag, de vorm van elke kaart, de weekteller, de rijen van de tabel en
  de punten van een grafiek met de gewichtswissels. De schermen lezen alleen uit
  die functies.
- "My results" en "Settings" krijgen elk een stap in de browsergeschiedenis,
  zodat de terugknop van de telefoon naar het beginscherm gaat.
- Wat nu goed werkt voor toetsenbord en schermlezer blijft: knoppen met een naam,
  de focus terug op de juiste plek na het sluiten van een blad of een kaart,
  tikvlakken van minstens 44 pixels, en de klok die elke minuut de resterende
  tijd meldt. Na "Done" gaat de focus naar de knop van de volgende kaart die nog
  te doen is. Is die er niet, dan naar de titel.
- Op een smalle telefoon (320 pixels) blijven de toetsen vijf naast elkaar. Past
  de open kaart niet op het scherm, dan schuift de app de toetsen in beeld, zoals
  nu.
- Dit ontwerp en het bouwplan staan in `superpowers/`, niet in `docs/`, omdat
  `docs/` de map is die als website online staat.

### Testen

- De bestaande Playwright-tests blijven de basis. Tests voor wat verdwijnt
  (weekmodel, weekstrook, verplaatsen, "This week", "Your plan", de schakelaar
  onderin, de vijf situaties van Today, "Your scores", het log en de historie
  van een oefening) gaan weg of worden vervangen.
- Nieuw getest wordt in elk geval: de vier vormen van een kaart; het doel
  ("To beat", "To match", "First time"); aftellen, starten, sets intikken en
  weghalen, pauze, "Stop and save", "Throw away" en "Cancel"; de tijd om met
  bewaren, een laatste set erna en "Done"; geen reps; bewaren dat niet lukt;
  opnieuw laden in elke stand; een kaart van een eerdere dag; de titels van het
  beginscherm; de weekteller met en zonder maatje; de tabel met pijltje,
  streepje, sterretje, "practice" en "Show all"; de grafieken met één score,
  meer scores en een gewichtswissel; "Settings" met elke regel; een profiel
  zonder `rotate` en een met; een open training van de oude versie; A, B en C
  aan; de terugknop; en back-up maken en terugzetten.
- De klok wordt getest met een nagemaakte tijd, zodat een test geen tien minuten
  duurt.
- Elke regel krijgt eerst een falende test, daarna de code.
- Voor oplevering loop ik de schermen na op telefoonbreedte, licht en donker.

## 8. Bouwvolgorde

Elke stap is af en bruikbaar voordat de volgende begint.

1. Regels en gegevens: `rotate`, de training van vandaag, de weekteller, per
   oefening bewaren, met tests. Zichtbaar verandert nog niets.
2. Het beginscherm met de kaarten "Te doen" en "Klaar", de weekteller en de twee
   knoppen. De klok opent voorlopig nog het oude trainingsscherm.
3. De klok op de knop: aftellen, lopen, pauze, tijd om, "Done". Het oude
   trainingsscherm gaat weg.
4. "My results": de tabel en de grafieken, ook voor een maatje.
5. "Settings" als scherm, het welkomscherm en de terugknop.
6. Opruimen van oude schermcode, `docs/` opnieuw bouwen, `SETUP.md` en `README`
   bijwerken. Online zetten pas na akkoord.

## 9. Aannames en risico's

- Steef doet steeds dezelfde drie oefeningen. Wil hij toch afwisselen, dan zet
  hij A, B en C aan in "Settings".
- Drie trainingen per week is het doel voor iedereen.
- Niemand wisselt van gewicht binnen één oefening van tien minuten.
- Alleen de website wordt bijgewerkt. De versie in Claude blijft staan zoals hij
  is.
- Staat de oude pagina nog ergens open en slaat die iets in je profiel op, dan
  wist hij `rotate`. Je doet dan weer steeds dezelfde drie tot je A, B en C
  opnieuw aanzet. Scores en trainingen blijven altijd staan. Na het online
  zetten laadt iedereen de pagina één keer opnieuw.
- Een oude pagina toont een training van vandaag die nog niet af is als een
  gewone training met overgeslagen oefeningen. Er gaat niets verloren.
- Teruggaan naar de huidige versie blijft mogelijk: de oude velden staan nog in
  het profiel en trainingen houden hun vorm.
- Piepjes klinken niet als de telefoon vergrendeld is of een andere app in beeld
  staat. Dat is nu ook zo.
