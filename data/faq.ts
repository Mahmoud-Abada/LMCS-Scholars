// src/data/faq.ts

export const faqData = [
  // General User
  {
    question: "How do I login?",
    answer: "Click 'Login' at the top right and enter your credentials.",
    keywords: ["login", "sign in", "connect"],
  },
  {
    question: "How do I reset my password?",
    answer: "Go to the login page and click 'Forgot Password'.",
    keywords: ["password", "forgot", "reset"],
  },
  {
    question: "Where can I see my profile?",
    answer: "Click your avatar at the top right, then select 'Profile'.",
    keywords: ["profile", "account", "settings"],
  },
  {
    question: "How do I edit my profile information?",
    answer: "Go to 'Profile' and click 'Edit Profile' to update your details.",
    keywords: ["edit profile", "update info", "change name"],
  },

  // Publications
  {
    question: "How can I submit a new publication?",
    answer: "Login as a researcher, go to 'My Publications', and click 'Submit New Publication'.",
    keywords: ["submit", "publication", "add paper"],
  },
  {
    question: "How do I edit a publication?",
    answer: "Go to 'My Publications', find the publication, and click 'Edit'.",
    keywords: ["edit", "update publication", "modify paper"],
  },
  {
    question: "How can I delete a publication?",
    answer: "Researchers can request deletion through 'My Publications' > 'Delete Request'.",
    keywords: ["delete publication", "remove paper"],
  },
  {
    question: "How do I search for publications?",
    answer: "Visitors can search publications by title, author, or keywords from the homepage.",
    keywords: ["search", "publications", "visitor"],
  },

  // Researchers
  {
    question: "How can I see the list of researchers?",
    answer: "Visitors can view researchers under the 'Researchers' section.",
    keywords: ["list researchers", "view researchers"],
  },
  {
    question: "How do I request to become a researcher?",
    answer: "You need to register first and request research privileges via your profile settings.",
    keywords: ["become researcher", "request researcher role"],
  },

  // Admin Section
  {
    question: "How do admins manage users?",
    answer: "Admins can manage users from the 'Admin Dashboard' under the 'Users' tab.",
    keywords: ["manage users", "admin dashboard"],
  },
  {
    question: "How do admins manage researchers?",
    answer: "Admins can add, edit, or delete researchers from the 'Researchers' management page.",
    keywords: ["manage researchers", "admin researchers"],
  },
  {
    question: "How to activate or deactivate a user?",
    answer: "Admins can toggle user activation status under 'Admin Dashboard' > 'Users'.",
    keywords: ["activate", "deactivate", "user", "admin"],
  },
  {
    question: "How do admins approve publications?",
    answer: "Pending publications appear in 'Admin Dashboard' > 'Publications' > 'Pending Approval'.",
    keywords: ["approve publication", "validate paper"],
  },
  {
    question: "How to link a researcher to a user account?",
    answer: "While editing a user, admins can link them to a researcher profile.",
    keywords: ["link researcher", "account link"],
  },

  // Miscellaneous
  {
    question: "What if I encounter a bug?",
    answer: "Please contact support through the 'Contact Us' form or notify the admin.",
    keywords: ["bug", "issue", "problem"],
  },
  {
    question: "Is there a dark mode?",
    answer: "Currently, dark mode is not available but it is planned for future updates.",
    keywords: ["dark mode", "theme", "appearance"],
  },
  {
    question: "Can I export publication data?",
    answer: "Researchers can export their publication list from their dashboard in CSV format.",
    keywords: ["export data", "download publications"],
  },
];
