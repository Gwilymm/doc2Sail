# 📊 PROJECTIONS FINANCIÈRES DOC2SAIL - GUIDE CSV

Ce fichier contient les données pour créer un modèle financier Excel interactif.

## Instructions pour créer le fichier Excel

1. Ouvrir Excel/Google Sheets/LibreOffice Calc
2. Copier-coller chaque section CSV ci-dessous dans des feuilles séparées
3. Formater en tableau avec en-têtes
4. Ajouter des graphiques (voir suggestions en fin de document)

---

## FEUILLE 1 : REVENUS MENSUELS (Année 1)

```csv
Mois,Clients Gratuit,Clients Club (39€),Clients Pro (149€),Clients Entreprise (499€),MRR Gratuit,MRR Club,MRR Pro,MRR Entreprise,MRR Total,ARR Progressif
M1,5,2,0,0,0,78,0,0,78,936
M2,8,4,0,0,0,156,0,0,156,1872
M3,12,6,1,0,0,234,149,0,383,4596
M4,15,10,2,0,0,390,298,0,688,8256
M5,17,14,3,1,0,546,447,499,1492,17904
M6,20,18,4,1,0,702,596,499,1797,21564
M7,22,21,5,1,0,819,745,499,2063,24756
M8,24,24,6,1,0,936,894,499,2329,27948
M9,26,26,7,2,0,1014,1043,998,3055,36660
M10,28,27,8,2,0,1053,1192,998,3243,38916
M11,30,28,9,2,0,1092,1341,998,3431,41172
M12,32,28,10,2,0,1092,1490,998,3580,42960
Total An 1,,,,,0,8112,8195,5988,22295,267540
```

**Calculs** :
- MRR = Nombre clients × Prix mensuel
- ARR Progressif = MRR × 12

---

## FEUILLE 2 : REVENUS ANNUELS (3 ans)

```csv
Année,Clients Gratuit,Clients Club,Clients Pro,Clients Entreprise,Total Clients Payants,ARPU Moyen (€),MRR Moyen (€),MRR Fin Année (€),ARR Abonnements (€),Setup Fees (€),Add-ons (€),ARR Total (€)
2026,32,28,10,2,40,45,1800,3580,21600,1600,400,23600
2027,80,95,45,10,150,57,8500,16400,102000,8000,4000,114000
2028,150,190,135,25,350,71,25000,45000,300000,25000,15000,340000
Total,,,,,540,,,423600,34600,19400,477600
```

**Formules suggérées** :
- ARPU = ARR Abonnements / Total Clients Payants
- MRR Moyen = ARR Abonnements / 12
- Total Clients = Gratuit + Payants

---

## FEUILLE 3 : RÉPARTITION PAR PLAN (An 1-3)

```csv
Plan,Prix Mensuel,Prix Annuel,An 1 Clients,An 1 ARR,An 2 Clients,An 2 ARR,An 3 Clients,An 3 ARR
Gratuit,0,0,32,0,80,0,150,0
Club,39,299,28,13104,95,44460,190,88920
Pro,149,1390,10,16788,45,83430,135,199065
Entreprise,499,5988,2,11976,10,71880,25,179700
Total Payants,,,40,41868,150,199770,350,467685
```

**Note** : Les clients annuels bénéficient de -36% (Club), -22% (Pro), -20% (Entreprise)

---

## FEUILLE 4 : COÛTS DÉTAILLÉS (3 ans)

```csv
Poste de Coût,An 1 (€),% CA An 1,An 2 (€),% CA An 2,An 3 (€),% CA An 3,Total 3 ans (€)
Salaires,0,0%,30000,26%,90000,27%,120000
Développement externe,5000,21%,15000,13%,20000,6%,40000
Infrastructure,1200,5%,4800,4%,12000,4%,18000
Marketing & Acquisition,15000,64%,25000,22%,40000,12%,80000
Outils SaaS,1500,6%,3600,3%,6000,2%,11100
Administratif,2000,8%,3000,3%,5000,1%,10000
Divers,1300,6%,3600,3%,7000,2%,11900
TOTAL,26000,110%,85000,74%,180000,53%,291000
```

**Analyse** :
- An 1 : Coûts > Revenus (investissement)
- An 2 : Quasi-équilibre (74% du CA)
- An 3 : Forte rentabilité (53% du CA, marge 47%)

---

## FEUILLE 5 : COMPTE DE RÉSULTAT (3 ans)

```csv
Ligne,An 1 (€),An 2 (€),An 3 (€),Total 3 ans (€)
REVENUS,,,,
Abonnements récurrents,19440,102000,300000,421440
Setup fees,1600,8000,25000,34600
Add-ons & Services,560,4000,15000,19560
TOTAL REVENUS,21600,114000,340000,475600
,,,,
COÛTS,,,,
Coûts Variables (30%),6480,34200,102000,142680
Coûts Fixes,19520,50800,78000,148320
TOTAL COÛTS,26000,85000,180000,291000
,,,,
EBITDA,-4400,29000,160000,184600
Amortissements,0,12000,40000,52000
RÉSULTAT NET,-4400,17000,120000,132600
,,,,
MARGES,,,,
Marge Brute,70%,70%,70%,70%
Marge EBITDA,-20%,25%,47%,39%
Marge Nette,-20%,15%,35%,28%
```

---

## FEUILLE 6 : MÉTRIQUES SAAS

```csv
Métrique,An 1,An 2,An 3,Benchmark SaaS,Performance
ACQUISITION,,,,
CAC (€),300,350,400,100-800,✅ Conforme
Clients Acquis,40,150,350,-,Croissance forte
Taux Conversion Gratuit→Payant,55%,65%,70%,30-50%,✅ Excellent
,,,,
RÉTENTION,,,,
Churn Mensuel,5,0%,2,5%,1,0%,0,5-1%,✅ Bon
Churn Annuel,45%,26%,12%,5-12%,✅ Amélioration
Taux Rétention,55%,74%,88%,88-95%,⚠️ → ✅
,,,,
REVENUS,,,,
ARPU (€),45,57,71,50-150,✅ Conforme
MRR (€),1800,8500,25000,-,Croissance 372%
ARR (€),21600,102000,300000,-,Croissance 372%
,,,,
EFFICACITÉ,,,,
LTV (€),630,1400,2200,-,Progression forte
LTV/CAC,2,1:1,4:1,5,5:1,3:1 min,⚠️ → ✅✅
CAC Payback (mois),14,10,7,12-15,✅ Rapide
Magic Number,0,6,0,85,1,2,>0,75,⚠️ → ✅
,,,,
CROISSANCE,,,,
Growth Rate MRR,-,372%,194%,10-30%,✅✅ Hyper
CAGR 3 ans,223%,-,-,12-50%,✅✅ Excellent
,,,,
PROFITABILITÉ,,,,
Marge Nette,-20%,15%,35%,20-40%,✅ Trajectoire saine
Burn Rate (€/mois),-367,+1417,+10000,-,Positif dès An 2
```

---

## FEUILLE 7 : TRÉSORERIE & CASH FLOW

```csv
Mois,Revenus Encaissés,Coûts Décaissés,Cash Flow Mensuel,Trésorerie Cumulée,Commentaire
M0 (Apport),0,0,0,10000,Apport initial
M1,78,2167,-2089,7911,Lancement
M2,156,2167,-2011,5900,
M3,383,2167,-1784,4116,
M4,688,2167,-1479,2637,
M5,1492,2167,-675,1962,Entreprise 1 !
M6,1797,2167,-370,1592,Point bas tréso
M7,2063,2167,-104,1488,Quasi-équilibre
M8,2329,2167,162,1650,Premier mois positif
M9,3055,2167,888,2538,
M10,3243,2167,1076,3614,
M11,3431,2167,1264,4878,
M12,3580,2167,1413,6291,Fin An 1 : +6,3K tréso
M24,16400,7083,9317,85000,Fin An 2 : +85K tréso
M36,45000,15000,30000,250000,Fin An 3 : +250K tréso
```

**Alerte Tréso** : Point bas M6 avec 1 592€. Marge de sécurité suffisante avec apport 10K€.

---

## FEUILLE 8 : SCÉNARIOS (Sensibilité)

```csv
Scénario,Clients An 3,ARR An 3,Profit An 3,Probabilité
Pessimiste (-30% clients),245,210000,40000,20%
Conservateur (base),350,300000,120000,50%
Réaliste (+10% clients),385,330000,145000,20%
Optimiste (+30% clients),455,390000,195000,10%
```

**Variables de sensibilité** :
- Churn ±1% → Impact ARR ±15%
- ARPU ±10€ → Impact ARR ±12%
- CAC ±50€ → Impact Profit An 1 ±2K€

---

## FEUILLE 9 : VALORISATION (Exit)

```csv
Année,ARR,Multiple Min,Multiple Max,Valorisation Min,Valorisation Max,Méthode
An 1,21600,2,4,43200,86400,Early stage (fort risque)
An 2,102000,3,5,306000,510000,Traction validée
An 3,300000,4,6,1200000,1800000,Rentabilité prouvée
An 5 (projection),800000,5,8,4000000,6400000,Scale atteint
```

**Comparables SaaS B2B** :
- HubSpot (IPO) : 10-15x ARR
- Mailchimp (Exit) : 8x ARR
- Doc2Sail cible : 4-6x (niche, taille modeste)

---

## FEUILLE 10 : HYPOTHÈSES CLÉS

```csv
Hypothèse,Valeur,Source,Risque
Marché France (régates/an),5000,FFVoile 2024,Faible
Taux pénétration An 3,7%,40 régates / 5000,Modéré
Churn An 1,5%/mois,Benchmark SaaS early stage,Élevé
Churn An 3,1%/mois,Benchmark SaaS mature,Modéré
Prix Club,39€,Benchmark SaaS SMB -20%,Faible
Prix Pro,149€,Benchmark SaaS Mid-Market,Faible
CAC,300-400€,15K€ mkt / 50 clients,Modéré
Conversion Gratuit→Club,55%,Freemium SaaS avg 30-50%,Modéré
Taux croissance An 2,372%,Hyper-croissance startup,Élevé
Marge brute,70%,SaaS standard 70-85%,Faible
```

---

## GRAPHIQUES SUGGÉRÉS

### 1. Évolution ARR (Ligne)
- Axe X : Mois 1-36
- Axe Y : ARR (€)
- Courbe : ARR progressif
- Jalons : An 1, An 2, An 3

### 2. Répartition Revenus par Plan (Camembert An 3)
- Club : 88 920€ (19%)
- Pro : 199 065€ (43%)
- Entreprise : 179 700€ (38%)

### 3. Évolution Profit (Barres)
- An 1 : -4 400€ (rouge)
- An 2 : +17 000€ (orange)
- An 3 : +120 000€ (vert)

### 4. Métriques SaaS (Radar)
- LTV/CAC : 5,5/6 (An 3)
- Churn : 1/1 (optimal)
- Marge : 35/40
- CAC Payback : 7/12 (mois)
- NPS : 75/70

### 5. Trésorerie (Aire)
- Axe X : Mois 0-36
- Axe Y : Trésorerie (€)
- Zone critique : <2 000€
- Zone sécurisée : >5 000€

### 6. Coûts vs Revenus (Barres Empilées)
- An 1 : Revenus 21,6K vs Coûts 26K
- An 2 : Revenus 102K vs Coûts 85K
- An 3 : Revenus 300K vs Coûts 180K

---

## FORMULES EXCEL UTILES

### Calcul CAC
```
=SOMME(Marketing_An1)/SOMME(Clients_Acquis_An1)
```

### Calcul LTV
```
=ARPU*12*(1/Churn_Mensuel)*Marge_Brute
```

### Calcul LTV/CAC
```
=LTV/CAC
```

### Calcul Churn Annuel depuis Mensuel
```
=1-(1-Churn_Mensuel)^12
```

### Calcul Magic Number (Trimestre)
```
=(ARR_T2-ARR_T1)/(Marketing_T1+Sales_T1)
```

### CAC Payback (mois)
```
=CAC/(ARPU*Marge_Brute)
```

---

## VALIDATION COHÉRENCE

**Checks automatiques à ajouter** :

1. ✅ Total Clients = Gratuit + Club + Pro + Entreprise
2. ✅ MRR Total = SOMME(MRR par plan)
3. ✅ ARR = MRR × 12 (si mensuel)
4. ✅ Profit = Revenus - Coûts
5. ✅ Marge % = Profit / Revenus
6. ✅ Trésorerie M(n) = Trésorerie M(n-1) + Cash Flow M(n)

---

## DONNÉES POUR PITCH DECK

**Slide "The Market"** :
- 5 000 régates/an France
- TAM 2,6M€ France, 15M€ Europe
- 0 concurrent direct

**Slide "Traction"** :
- MVP déployé octobre 2025
- 10 bêta-testeurs prévus
- Partenariat FFVoile en cours

**Slide "Business Model"** :
- SaaS B2B Freemium
- 39€ (Club) → 149€ (Pro) → 499€+ (Entreprise)
- ROI client : 3 400-6 400%

**Slide "Projections"** :
- An 3 : 350 clients, 300K€ ARR, +120K€ profit
- Marge 35% (vs 20-40% benchmark)
- Rentabilité An 2 (M10)

**Slide "Ask"** :
- 20K€ seed funding
- 10-15% equity
- Ou prêt d'honneur 0%

---

## 📊 FICHIER EXCEL PRÊT À L'EMPLOI

**Pour créer le fichier Excel complet** :

1. Copier chaque section CSV ci-dessus
2. Créer une feuille par section (10 feuilles)
3. Formater en tableaux avec filtres
4. Ajouter les 6 graphiques suggérés
5. Créer un tableau de bord (Dashboard) avec :
   - KPIs principaux (ARR, MRR, Clients, Marge)
   - Graphique ARR 3 ans
   - Graphique Profit 3 ans
   - Métriques SaaS (Radar)

**Alternative** : Importer dans Google Sheets pour partage collaboratif en ligne.

---

**Besoin d'aide ?** 
- Tutoriel vidéo : [À créer]
- Template Excel téléchargeable : [À créer]

**© 2025 Doc2Sail - Projections Financières**
