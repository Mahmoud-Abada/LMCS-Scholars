"use client"

import { useLanguage } from "@/components/language-provider"

const translations = {
  en: {
    // Navigation
    'home': 'Home',
    'publications': 'Publications',
    'researchers': 'Researchers',
    'about': 'About',
    'contact': 'Contact',
    'dashboard': 'Dashboard',
    
    // Auth
    'signin': 'Sign In',
    'signup': 'Sign Up',
    'signout': 'Sign Out',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm Password',
    'forgot_password': 'Forgot Password?',
    'reset_password': 'Reset Password',
    'name': 'Name',
    'role': 'Role',
    
    // Roles
    'admin': 'Administrator',
    'assistant': 'Assistant',
    'researcher': 'Researcher',
    'visitor': 'Visitor',
    
    // Publications
    'title': 'Title',
    'authors': 'Authors',
    'year': 'Year',
    'venue': 'Venue',
    'abstract': 'Abstract',
    'keywords': 'Keywords',
    'doi': 'DOI',
    'url': 'URL',
    'citation': 'Citation',
    'add_publication': 'Add Publication',
    'edit_publication': 'Edit Publication',
    'delete_publication': 'Delete Publication',
    'publication_details': 'Publication Details',
    'recent_publications': 'Recent Publications',
    
    // Researchers
    'add_researcher': 'Add Researcher',
    'edit_researcher': 'Edit Researcher',
    'delete_researcher': 'Delete Researcher',
    'researcher_details': 'Researcher Details',
    'position': 'Position',
    'department': 'Department',
    'bio': 'Biography',
    'research_interests': 'Research Interests',
    'education': 'Education',
    'contact_info': 'Contact Information',
    
    // UI
    'search': 'Search',
    'filter': 'Filter',
    'sort': 'Sort',
    'save': 'Save',
    'cancel': 'Cancel',
    'submit': 'Submit',
    'loading': 'Loading...',
    'no_results': 'No results found',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    
    // Footer
    'copyright': '© 2025 LMCS Laboratory - ESI Algiers. All rights reserved.',
    'privacy_policy': 'Privacy Policy',
    'terms_of_service': 'Terms of Service',
  },
  fr: {
    // Navigation
    'home': 'Accueil',
    'publications': 'Publications',
    'researchers': 'Chercheurs',
    'about': 'À propos',
    'contact': 'Contact',
    'dashboard': 'Tableau de bord',
    'Laboratory of Mathematical and Computer Science':'laboratoire de mathématiques et d\'informatique',

    
    // Auth
    'signin': 'Connexion',
    'signup': 'Inscription',
    'signout': 'Déconnexion',
    'email': 'Email',
    'password': 'Mot de passe',
    'confirm_password': 'Confirmer le mot de passe',
    'forgot_password': 'Mot de passe oublié?',
    'reset_password': 'Réinitialiser le mot de passe',
    'name': 'Nom',
    'role': 'Rôle',
    
    // Roles
    'admin': 'Administrateur',
    'assistant': 'Assistant',
    'researcher': 'Chercheur',
    'visitor': 'Visiteur',
    
    // Publications
    'title': 'Titre',
    'authors': 'Auteurs',
    'year': 'Année',
    'venue': 'Lieu',
    'abstract': 'Résumé',
    'keywords': 'Mots-clés',
    'doi': 'DOI',
    'url': 'URL',
    'citation': 'Citation',
    'add_publication': 'Ajouter une publication',
    'edit_publication': 'Modifier la publication',
    'delete_publication': 'Supprimer la publication',
    'publication_details': 'Détails de la publication',
    'recent_publications': 'Publications récentes',
    'ESI Algiers - Managing research publications and academic contributions':'ESI Algiers - Gestion des publications de recherche et des contributions académiques',
    "Explore our diverse research areas including AI, cybersecurity, software engineering, and more.":"Explorez nos domaines de recherche variés, notamment l'IA, la cybersécurité, l'ingénierie logicielle et bien plus.",
"Discover our partnerships with academic institutions and industry leaders worldwide.":"Découvrez nos partenariats avec des institutions académiques et des leaders de l'industrie à travers le monde.",
"Explore the latest research publications from our laboratory.":"Découvrez les dernières publications de recherche de notre laboratoire.",
    "The Laboratory of Methods for System Design (LMCS) at ESI Algiers is dedicated to advancing research in computer science, mathematics, and related fields. Our researchers work on cutting-edge topics, including artificial intelligence, software engineering, cybersecurity, and data science.":"Le Laboratoire de Méthodes de Conception des Systèmes (LMCS) de l’ESI Alger est dédié à l’avancement de la recherche en informatique, en mathématiques et dans des domaines connexes. Nos chercheurs travaillent sur des sujets de pointe, notamment l’intelligence artificielle, l’ingénierie logicielle, la cybersécurité et la science des données",
    // Researchers
    'add_researcher': 'Ajouter un chercheur',
    'edit_researcher': 'Modifier le chercheur',
    'delete_researcher': 'Supprimer le chercheur',
    'researcher_details': 'Détails du chercheur',
    'position': 'Poste',
    'department': 'Département',
    'bio': 'Biographie',
    'research_interests': 'Intérêts de recherche',
    'education': 'Formation',
    'contact_info': 'Coordonnées',
    
    // UI
    'search': 'Rechercher',
    'filter': 'Filtrer',
    'sort': 'Trier',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'submit': 'Soumettre',
    'loading': 'Chargement...',
    'no_results': 'Aucun résultat trouvé',
    'light': 'Clair',
    'dark': 'Sombre',
    'system': 'Système',
    
    // Footer
    'copyright': '© 2025 Laboratoire LMCS - ESI Alger. Tous droits réservés.',
    'privacy_policy': 'Politique de confidentialité',
    'terms_of_service': 'Conditions d\'utilisation',
    "Période": "Period",
  "Partenaire": "Partner",
  "Types d’actions": "Types of actions",
  
  "SUMT (Service Universitaire Médecine de Travail), Hopital Rouiba, Alger": "SUMT (University Occupational Health Service), Rouiba Hospital, Algiers",
  "(e-santé) Banque de données ; S.I Intégré médecine de travail ; évaluation des risques professionnels en santé": "(e-health): Database; Integrated occupational health information system; assessment of occupational health risks",

  "INCC (Institut Nationale de Criminologie et Criminalistique) (Gendarmerie Nationale)": "INCC (National Institute of Criminology and Criminalistics) (National Gendarmerie)",
  "(Gouvernance, sécurité) : Détection et prédiction de l’évolution des communautés dans les réseaux (application à la criminalité)": "(Governance, security): Detection and prediction of community evolution in networks (application to criminality)",

  "CRD (Centre de Recherche et Développement) de la Gendarmerie Nationale": "CRD (Research and Development Center) of the National Gendarmerie",
  "(e-Sécurité) : Analyse du trafic, investigation forensique, reconnaissance automatique, analyse prédictive": "(e-security): Traffic analysis, forensic investigation, automatic recognition, predictive analysis",

  "CDTA (Centre Des Technologies Avancées), Baba Hacen, Alger": "CDTA (Center for Advanced Technologies), Baba Hacen, Algiers",
  "Dissémination scientifique, Partage d’expérience": "Scientific dissemination, Experience sharing",

  "CERIST (Centre d’Etudes et de Recherches en Information scientifique et Technique), Alger": "CERIST (Center for Scientific and Technical Information Studies and Research), Algiers",
  "Formation à la recherche, partage de ressources": "Research training, Resource sharing",

  "INPV (Institut National de Protection des Végétaux), El Harrach, Alger": "INPV (National Institute of Plant Protection), El Harrach, Algiers",
  "(e-agriculture, gestion des catastrophes) : Crowd-sourcing, Gestion collaborative des crises (lutte antiacridienne)": "(e-agriculture, disaster management): Crowd-sourcing, Collaborative crisis management (locust control)"

  }
}

export function useTranslation() {
  const { language } = useLanguage()
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key
  }
  
  return { t }
}