# Sistemi e Menaxhimit të Shpenzimeve - Expense Tracker
**Studente**:  Saranda Osmani
**Lënda:**: Programimi i Avancuar 
**Projekti:** Sistemi i Menaxhimit të Shpenzimeve për Kompani  

## Përshkrimi i Projektit
Ky projekt është një sistem i plotë për menaxhimin e shpenzimeve të punonjësve në një kompani. Aplikacioni lejon punonjësit të dorëzojnë shpenzimet e tyre dhe administratorët të i shqyrtojnë dhe miratojnë ato. Sistemi përmban edhe një modul të integruar për zbulimin e mashtrimit që kontrollon automatikisht shpenzimet e dyshimta.

## Objektivat e Projektit

- **Krijimi i një sistemi modern** për menaxhimin e shpenzimeve
- **Implementimi i autentifikimit dhe autorizimit** të sigurt
- **Zhvillimi i një algoritmi për zbulimin e mashtrimit**
- **Dizajnimi i një ndërfaqeje të përdorshme** me React dhe Next.js
- **Integrimi i bazës së të dhënave** MongoDB
- **Aplikimi i principeve të inxhinierisë së softuerit**

## Arkitektura e Sistemit

### Frontend (Client-Side)
- **Framework:** Next.js me TypeScript
- **Styling:** Tailwind CSS për dizajn modern

### Backend (Server-Side)
- **Runtime:** Node.js me Express.js
- **Gjuha:** JavaScript dhe TypeScript
- **Baza e të dhënave:** MongoDB 
- **Autentifikimi:** JWT (JSON Web Tokens)
- **Validimi:** Express Validator
- **Logging:** Winston logger

### Infrastruktura
- **Kontejnerizimi:** Docker dhe Docker Compose
- **Baza e të dhënave:** MongoDB në kontejner
- **Proxy:** Nginx (opsionale)

## Instalimi dhe Konfigurimi

### Parakushtet
```bash
- Node.js (v18 ose më i ri)
- Docker dhe Docker Compose
- Git
- MongoDB (nëse nuk përdorni Docker)
```

### Hapat e Instalimit

1. **Klononi repositorin:**
```bash
git clone https://github.com/username/expense-tracker.git
cd expense-tracker
```

2. **Konfiguroni variablat e mjedisit:**
```bash
# Krijoni file .env në direktorinë api/
cd api
cp config.example.js config.js
```

3. **Instaloni dependencat:**
```bash
# Backend
cd api
npm install

# Frontend
cd ../front
npm install
```

4. **Startoni bazën e të dhënave:**
```bash
# Nga direktoria root
docker-compose up -d
```

5. **Startoni aplikacionin:**
```bash
# Terminal 1 - Backend
cd api
npm run dev

# Terminal 2 - Frontend
cd front
npm run dev
```

### Startimi i Shpejtë me Batch Files
```bash
# Për Windows
start-backend.bat
start-frontend.bat
```

## Strukturat e të Dhënave

### Modeli i Përdoruesit (User)
```javascript
{
  username: String,      // Emri i përdoruesit
  email: String,         // Email adresa
  password: String,      // Fjalëkalimi i enkriptuar
  firstName: String,     // Emri
  lastName: String,      // Mbiemri
  department: String,    // Departamenti
  role: String,          // "employee" ose "administrator"
  isActive: Boolean,     // Statusi aktiv
  createdAt: Date,       // Data e krijimit
  updatedAt: Date        // Data e përditësimit
}
```

### Modeli i Shpenzimit (Expense)
```javascript
{
  userId: ObjectId,      // ID e përdoruesit
  amount: Number,        // Shuma (max 10,000)
  category: String,      // Kategoria e shpenzimit
  description: String,   // Përshkrimi
  date: Date,           // Data e shpenzimit
  receiptUrl: String,   // URL e faturës (opsionale)
  status: String,       // "pending", "approved", "rejected"
  reviewedBy: ObjectId, // ID e shqyrtuesit
  reviewedAt: Date,     // Data e shqyrtimit
  reviewNotes: String,  // Shënimet e shqyrtimit
  isFlagged: Boolean,   // A është sinjalizuar si i dyshimtë
  flagReason: String,   // Arsyeja e sinjalizimit
  flaggedAt: Date,      // Data e sinjalizimit
  createdAt: Date,      // Data e krijimit
  updatedAt: Date       // Data e përditësimit
}
```

## Sistemi i Autentifikimit

### Rolet e Përdoruesve
1. **Employee (Punonjësi):**
   - Dorëzon shpenzimet e reja
   - Shikon shpenzimet e veta
   - Përditëson shpenzimet në gjendje "pending"
   - Shikon statusin e miratimit

2. **Administrator:**
   - Të gjitha privilegjet e punonjësit
   - Shikon të gjitha shpenzimet
   - Miraton ose refuzon shpenzimet
   - Menaxhon përdoruesit
   - Qaset në analitikë dhe raporte
   - Shqyrton shpenzimet e sinjalizuara

### Rrjedha e Autentifikimit
```
1. Përdoruesi logohet me username/password
2. Serveri verifikon kredencialet
3. Krijohet JWT token (24 orë)
4. Token-i ruhet në cookies
5. Çdo kërkesë përmban token-in në header
6. Middleware verifikon token-in për çdo route të mbrojtur
```

## 🔍 Sistemi i Zbulimit të Mashtrimit

### Algoritmat e Kontrollit

#### 1. Kontrolli i Shumave të Dyfishta
```javascript
// Kontrollon për shuma identike brenda 60 minutave
timeWindow = 60 minuta
if (shumaEnjësoj === shumaEkzistuese && diferencinaKohore < 60min) {
    flagAssuspicious("Shumë të dyfishta brenda 60 minutave");
}
```

#### 2. Kontrolli i Shumave të Larta
```javascript
HIGH_THRESHOLD = 1000€    // Shuma e lartë
VERY_HIGH_THRESHOLD = 5000€  // Shuma shumë e lartë

if (shuma >= 5000) {
    flag("Shumë shumë e lartë - kërkon shqyrtim shtesë");
} else if (shuma >= 1000) {
    flag("Shumë e lartë - sinjalizuar për shqyrtim");
}
```

#### 3. Kontrolli i Numrave të Rrumbullakosur
```javascript
// Kontrollon për numra të rrumbullakosur (25, 50, 100, etj.)
if (shuma % 100 === 0 || shuma % 50 === 0 || shuma % 25 === 0) {
    flag("Numër i rrumbullakosur - i dyshimtë");
}
```

#### 4. Kontrolli i Dorëzimeve të Shpejta
```javascript
// Kontrollon për më shumë se 5 dorëzime brenda 30 minutave
if (numriDorëzimeve >= 5 && kohaMessage < 30minuta) {
    flag("Shumë dorëzime brenda kohës së shkurtër");
}
```

#### 5. Kontrolli i Përshkrimeve të Ngjashme
```javascript
// Kontrollon për përshkrime të ngjashme brenda 7 ditëve
if (përshkrimeNgjashme.length > 2) {
    flag("Përshkrime të ngjashme në dorëzimet e fundit");
}
```

## 🛠️ Funksionalitetet Kryesore

### Për Punonjësit
- **Dorëzimi i Shpenzimeve:** Formular i detajuar me validim
- **Shikimi i Shpenzimeve:** Lista e plotë me filtrime
- **Gjendja e Shpenzimeve:** Tracking i statusit (pending, approved, rejected)
- **Përditësimi:** Editim i shpenzimeve pending
- **Upload i Faturave:** Mundësi për të bashkangjitur URL të faturës

### Për Administratorët
- **Dashboard i Administratorit:** Pamje e përgjithshme e statistikave
- **Menaxhimi i Shpenzimeve:** Miratim/refuzim masiv
- **Shpenzimet e Sinjalizuara:** Faqe e dedikuar për shqyrtimin e mashtrimit
- **Analitikë:** Grafikë dhe raporte të detajuara


##  Ndërfaqja e Përdoruesit

### Dizajni dhe UX
- **Responsive Design:** Funksionon në të gjitha pajisjet
- **Tema Moderne:** Dizajn i pastër me Tailwind CSS

### Navigimi
```
├── Dashboard (Ballina)
├── My Expenses (Shpenzimet e Mia)
├── Add Expense (Shto Shpenzim)
├── All Expenses (Të Gjitha - vetëm admin)
├── Flagged Expenses (Të Sinjalizuara - vetëm admin)
├── Users (Përdoruesit - vetëm admin)
├── Analytics (Analitika - vetëm admin)
└── Settings (Cilësimet)
```

## 🧪 Testimi dhe Të Dhënat Fillestare

### Llogaritë e Testimit

**Administrator:**
- Username: `admin1`
- Password: `Admin123!`
- Email: `admin@company.com`

**Punonjësit:**
- Username: `john_doe` | Password: `Employee123!`
- Username: `jane_smith` | Password: `Employee123!`
- Username: `bob_johnson` | Password: `Employee123!`
- Username: `alice_wilson` | Password: `Employee123!`

### Të Dhënat e Testimit
Sistemi krijon automatikisht:
- 50+ shpenzime të ndryshme
- Shpenzime të sinjalizuara për testim
- Shpenzime të miratuara/refuzuara
- Të dhëna të ndryshme statistikore


