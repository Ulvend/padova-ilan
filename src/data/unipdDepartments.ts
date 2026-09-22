export interface UniPdDepartment {
  code: string;
  name: string;
  school: string;
  englishName: string;
}

export const UNIPD_DEPARTMENTS: UniPdDepartment[] = [
  // Scuola di Ingegneria
  {
    code: 'DEI',
    name: "DEI - Ingegneria dell'Informazione (Computer, Bioengineering, Electronics)",
    school: 'Scuola di Ingegneria',
    englishName: 'Department of Information Engineering',
  },
  {
    code: 'DII',
    name: 'DII - Ingegneria Industriale (Aerospace, Chemical, Energy, Materials, Mechanical)',
    school: 'Scuola di Ingegneria',
    englishName: 'Department of Industrial Engineering',
  },
  {
    code: 'ICEA',
    name: 'ICEA - Ingegneria Civile, Edile e Ambientale',
    school: 'Scuola di Ingegneria',
    englishName: 'Department of Civil, Architectural and Environmental Engineering',
  },
  {
    code: 'DTG',
    name: 'DTG - Tecnica e Gestione dei Sistemi Industriali (Vicenza)',
    school: 'Scuola di Ingegneria',
    englishName: 'Department of Management and Engineering',
  },

  // Scuola di Medicina e Chirurgia
  {
    code: 'DIMED',
    name: 'DIMED - Medicina (Medicine and Surgery)',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Medicine',
  },
  {
    code: 'DiSCO',
    name: 'DiSCO - Scienze Cardio-Toraco-Vascolari e Sanità Pubblica',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Cardiac, Thoracic, Vascular Sciences and Public Health',
  },
  {
    code: 'DMM',
    name: 'DMM - Medicina Molecolare',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Molecular Medicine',
  },
  {
    code: 'DSCTV',
    name: 'DSCTV - Scienze Chirurgiche, Oncologiche e Gastroenterologiche',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Surgical, Oncological and Gastroenterological Sciences',
  },
  {
    code: 'DNS',
    name: 'DNS - Neuroscienze',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Neurosciences',
  },
  {
    code: 'SDB',
    name: 'SDB - Salute della Donna e del Bambino (Pediatria & Ostetricia)',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: "Department of Women's and Children's Health",
  },
  {
    code: 'DSB',
    name: 'DSB - Scienze Biomediche',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Biomedical Sciences',
  },
  {
    code: 'DSF',
    name: 'DSF - Scienze del Farmaco (Farmacia & CTF)',
    school: 'Scuola di Medicina e Chirurgia',
    englishName: 'Department of Pharmaceutical and Pharmacological Sciences',
  },

  // Scuola di Economia e Scienze Politiche
  {
    code: 'dSEA',
    name: 'dSEA - Scienze Economiche e Aziendali "Marco Fanno"',
    school: 'Scuola di Economia e Scienze Politiche',
    englishName: 'Department of Economics and Management',
  },
  {
    code: 'SPGI',
    name: 'SPGI - Scienze Politiche, Giuridiche e Studi Internazionali',
    school: 'Scuola di Economia e Scienze Politiche',
    englishName: 'Department of Political Science, Law, and International Studies',
  },

  // Scuola di Scienze
  {
    code: 'DM',
    name: 'DM - Matematica "Tullio Levi-Civita" (Computer Science & Mathematics)',
    school: 'Scuola di Scienze',
    englishName: 'Department of Mathematics',
  },
  {
    code: 'DFA',
    name: 'DFA - Fisica e Astronomia "Galileo Galilei"',
    school: 'Scuola di Scienze',
    englishName: 'Department of Physics and Astronomy',
  },
  {
    code: 'DiBio',
    name: 'DiBio - Biologia',
    school: 'Scuola di Scienze',
    englishName: 'Department of Biology',
  },
  {
    code: 'DiSC',
    name: 'DiSC - Scienze Chimiche',
    school: 'Scuola di Scienze',
    englishName: 'Department of Chemical Sciences',
  },
  {
    code: 'Geoscienze',
    name: 'Geoscienze - Geoscienze e Geologia',
    school: 'Scuola di Scienze',
    englishName: 'Department of Geosciences',
  },
  {
    code: 'DiSS',
    name: 'DiSS - Scienze Statistiche',
    school: 'Scuola di Scienze',
    englishName: 'Department of Statistical Sciences',
  },

  // Scuola di Psicologia
  {
    code: 'DPG',
    name: 'DPG - Psicologia Generale',
    school: 'Scuola di Psicologia',
    englishName: 'Department of General Psychology',
  },
  {
    code: 'DPSS',
    name: 'DPSS - Psicologia dello Sviluppo e della Socializzazione',
    school: 'Scuola di Psicologia',
    englishName: 'Department of Developmental Psychology and Socialisation',
  },

  // Scuola di Giurisprudenza
  {
    code: 'DPCD',
    name: 'DPCD - Diritto Pubblico, Comparato e Internazionale',
    school: 'Scuola di Giurisprudenza',
    englishName: 'Department of Public, Comparative and International Law',
  },
  {
    code: 'DPPR',
    name: 'DPPR - Diritto Privato e Critica del Diritto',
    school: 'Scuola di Giurisprudenza',
    englishName: 'Department of Private Law and Critique of Law',
  },

  // Scuola di Scienze Umane, Sociali e del Patrimonio Culturale
  {
    code: 'DBC',
    name: 'DBC - Beni Culturali (Archeologia, Storia dell\'Arte, Cinema, Musica)',
    school: 'Scuola di Scienze Umane e Sociali',
    englishName: 'Department of Cultural Heritage',
  },
  {
    code: 'FISPPA',
    name: 'FISPPA - Filosofia, Sociologia, Pedagogia e Psicologia Applicata',
    school: 'Scuola di Scienze Umane e Sociali',
    englishName: 'Department of Philosophy, Sociology, Education and Applied Psychology',
  },
  {
    code: 'DiSLL',
    name: 'DiSLL - Studi Linguistici e Letterari (Lingue e Letterature Straniere)',
    school: 'Scuola di Scienze Umane e Sociali',
    englishName: 'Department of Linguistic and Literary Studies',
  },
  {
    code: 'DiSSGeA',
    name: 'DiSSGeA - Scienze Storiche, Geografiche e dell\'Antichità',
    school: 'Scuola di Scienze Umane e Sociali',
    englishName: 'Department of Historical and Geographic Sciences and the Ancient World',
  },

  // Scuola di Agraria e Medicina Veterinaria
  {
    code: 'DAFNAE',
    name: 'DAFNAE - Agronomia, Animali, Alimenti, Risorse naturali e Ambiente',
    school: 'Scuola di Agraria e Medicina Veterinaria',
    englishName: 'Department of Agronomy, Food, Natural resources, Animals and Environment',
  },
  {
    code: 'BCA',
    name: 'BCA - Biomedicina Comparata e Alimentazione',
    school: 'Scuola di Agraria e Medicina Veterinaria',
    englishName: 'Department of Comparative Biomedicine and Food Science',
  },
  {
    code: 'MAPS',
    name: 'MAPS - Medicina Animale, Produzioni e Salute',
    school: 'Scuola di Agraria e Medicina Veterinaria',
    englishName: 'Department of Animal Medicine, Production and Health',
  },
  {
    code: 'TESAF',
    name: 'TESAF - Territorio e Sistemi Agro-Forestali',
    school: 'Scuola di Agraria e Medicina Veterinaria',
    englishName: 'Department of Land, Environment, Agriculture and Forestry',
  },
];
