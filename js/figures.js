/**
 * Liste complète des 50 figurines / accessoires du site HarryPotterPops
 * Kinder Joy Harry Potter (séries Quidditch + autres)
 * Codes extraits du site https://twagirumukiza.github.io/HarryPotterPops/
 */
const FIGURES = [
  // === Série Quidditch 2024 (principales) ===
  { id: "01", name: "Severus Snape", code: "VD390A", rarity: "standard", category: "quidditch", searchTerms: ["Severus Snape", "Snape Kinder Joy", "VD390A"] },
  { id: "02", name: "Albus Dumbledore", code: "VD391A", rarity: "standard", category: "quidditch", searchTerms: ["Albus Dumbledore", "Dumbledore Kinder Joy", "VD391A"] },
  { id: "03", name: "Cedric Diggory", code: "VT393", rarity: "standard", category: "quidditch", searchTerms: ["Cedric Diggory", "Cedric Kinder Joy", "VT393"] },
  { id: "04", name: "Draco Malfoy", code: "VT394", rarity: "standard", category: "quidditch", searchTerms: ["Draco Malfoy", "Malfoy Kinder Joy", "VT394"] },
  { id: "05", name: "Ginny Weasley", code: "VT395", rarity: "standard", category: "quidditch", searchTerms: ["Ginny Weasley", "Ginny Kinder Joy", "VT395"] },
  { id: "06", name: "Harry Potter", code: "VT396", rarity: "standard", category: "quidditch", searchTerms: ["Harry Potter Quidditch", "Harry VT396", "VT396"] },
  { id: "07", name: "Hermione Granger", code: "VT397", rarity: "standard", category: "quidditch", searchTerms: ["Hermione Granger", "Hermione Kinder Joy", "VT397"] },
  { id: "08", name: "Luna Lovegood", code: "VT398", rarity: "standard", category: "quidditch", searchTerms: ["Luna Lovegood", "Luna Kinder Joy", "VT398"] },
  { id: "09", name: "Madam Hooch", code: "VT399", rarity: "standard", category: "quidditch", searchTerms: ["Madam Hooch", "Rolanda Hooch", "VT399"] },
  { id: "10", name: "Ron Weasley", code: "VT400", rarity: "standard", category: "quidditch", searchTerms: ["Ron Weasley", "Ron Kinder Joy", "VT400"] },
  { id: "11", name: "Harry Potter GOLD", code: "VT401", rarity: "gold", category: "quidditch", searchTerms: ["Harry Potter Gold", "Harry GOLD VT401", "VT401"] },
  { id: "12", name: "Rubeus Hagrid", code: "VT402", rarity: "standard", category: "quidditch", searchTerms: ["Rubeus Hagrid", "Hagrid Kinder Joy", "VT402"] },
  { id: "13", name: "Harry Potter GOLD (variant)", code: "VT413", rarity: "gold", category: "quidditch", searchTerms: ["Harry Potter Gold VT413", "Harry GOLD VT413", "VT413"] },
  { id: "14", name: "Cho Chang", code: "VT436", rarity: "standard", category: "quidditch", searchTerms: ["Cho Chang", "Cho Chang Kinder Joy", "VT436"] },

  // === Accessoires Quidditch ===
  { id: "15", name: "Draco Malfoy Cable Holder", code: "VT403", rarity: "accessory", category: "accessory", searchTerms: ["Draco Cable Holder", "VT403", "Kabelhalter Draco"] },
  { id: "16", name: "Harry Potter Cable Holder", code: "VT404", rarity: "accessory", category: "accessory", searchTerms: ["Harry Cable Holder", "VT404", "Kabelhalter Harry"] },
  { id: "17", name: "Ron Pop-It", code: "VT405", rarity: "accessory", category: "accessory", searchTerms: ["Ron Pop-It", "VT405", "Ron Pop It"] },
  { id: "18", name: "Fred & George Pop-It", code: "VT406", rarity: "accessory", category: "accessory", searchTerms: ["Fred George Pop-It", "VT406"] },
  { id: "19", name: "Golden Snitch Pop-It", code: "VT407", rarity: "accessory", category: "accessory", searchTerms: ["Golden Snitch Pop-It", "VT407", "Goldener Schnatz"] },
  { id: "20", name: "Ginny Pen Holder", code: "VT408", rarity: "accessory", category: "accessory", searchTerms: ["Ginny Pen Holder", "VT408", "Stiftehalter Ginny"] },
  { id: "21", name: "Gryffindor Sticker Holder", code: "VT410", rarity: "accessory", category: "accessory", searchTerms: ["Gryffindor Sticker Holder", "VT410"] },
  { id: "22", name: "Luna Lanyard", code: "VT411", rarity: "accessory", category: "accessory", searchTerms: ["Luna Lanyard", "VT411", "Luna Anhänger"] },
  { id: "23", name: "Gryffindor Tower", code: "VT412", rarity: "accessory", category: "accessory", searchTerms: ["Gryffindor Tower", "VT412", "Gryffindor Turm"] },
  { id: "24", name: "Ginny Clip", code: "VT430", rarity: "accessory", category: "accessory", searchTerms: ["Ginny Clip", "VT430"] },
  { id: "25", name: "Slytherin Bookmark", code: "VT431", rarity: "accessory", category: "accessory", searchTerms: ["Slytherin Bookmark", "VT431", "Slytherin Lesezeichen"] },
  { id: "26", name: "Slytherin Tower", code: "VT443", rarity: "accessory", category: "accessory", searchTerms: ["Slytherin Tower", "VT443", "Slytherin Turm"] },

  // === Autres séries Kinder Joy Harry Potter ===
  { id: "27", name: "Luna Lovegood", code: "VD392", rarity: "standard", category: "other", searchTerms: ["Luna Lovegood VD392", "VD392"] },
  { id: "28", name: "Professor Trelawney", code: "VD426", rarity: "standard", category: "other", searchTerms: ["Professor Trelawney", "Trelawney Kinder Joy", "VD426"] },
  { id: "29", name: "Hermione Granger", code: "VD387", rarity: "standard", category: "other", searchTerms: ["Hermione Granger VD387", "VD387"] },
  { id: "30", name: "Harry Potter", code: "VD385", rarity: "standard", category: "other", searchTerms: ["Harry Potter VD385", "VD385"] },
  { id: "31", name: "Rubeus Hagrid", code: "VD386", rarity: "standard", category: "other", searchTerms: ["Rubeus Hagrid VD386", "VD386"] },
  { id: "32", name: "Minerva McGonagall", code: "VD388", rarity: "standard", category: "other", searchTerms: ["Minerva McGonagall", "McGonagall Kinder Joy", "VD388"] },
  { id: "33", name: "Ron Weasley", code: "VD389", rarity: "standard", category: "other", searchTerms: ["Ron Weasley VD389", "VD389"] },
  { id: "34", name: "Severus Snape", code: "VD390", rarity: "standard", category: "other", searchTerms: ["Severus Snape VD390", "VD390"] },
  { id: "35", name: "Albus Dumbledore", code: "VD391", rarity: "standard", category: "other", searchTerms: ["Albus Dumbledore VD391", "VD391"] },
  { id: "36", name: "Dobby", code: "VD393", rarity: "standard", category: "other", searchTerms: ["Dobby Kinder Joy", "VD393"] },
  { id: "37", name: "Hedwig", code: "VD394", rarity: "standard", category: "other", searchTerms: ["Hedwig Kinder Joy", "VD394"] },
  { id: "38", name: "Harry Potter", code: "VD395", rarity: "standard", category: "other", searchTerms: ["Harry Potter VD395", "VD395"] },
  { id: "39", name: "Luna Lovegood", code: "VD396", rarity: "standard", category: "other", searchTerms: ["Luna Lovegood VD396", "VD396"] },
  { id: "40", name: "Cedric Diggory", code: "VD412", rarity: "standard", category: "other", searchTerms: ["Cedric Diggory VD412", "VD412"] },
  { id: "41", name: "Hermione Granger", code: "VD413", rarity: "standard", category: "other", searchTerms: ["Hermione Granger VD413", "VD413"] },
  { id: "42", name: "Hogwarts Express", code: "VD422", rarity: "standard", category: "other", searchTerms: ["Hogwarts Express", "VD422"] },
  { id: "43", name: "Hogwarts", code: "VD423", rarity: "standard", category: "other", searchTerms: ["Hogwarts Kinder Joy", "VD423"] },
  { id: "44", name: "Draco Malfoy", code: "VD424", rarity: "standard", category: "other", searchTerms: ["Draco Malfoy VD424", "VD424"] },
  { id: "45", name: "Alastor Mad-Eye Moody", code: "VD425", rarity: "standard", category: "other", searchTerms: ["Mad-Eye Moody", "Alastor Moody", "VD425"] },
  { id: "46", name: "Cho Chang", code: "VD427", rarity: "standard", category: "other", searchTerms: ["Cho Chang VD427", "VD427"] },
  { id: "47", name: "Luna Lovegood", code: "VD437", rarity: "standard", category: "other", searchTerms: ["Luna Lovegood VD437", "VD437"] },
  { id: "48", name: "Draco Malfoy", code: "VD438", rarity: "standard", category: "other", searchTerms: ["Draco Malfoy VD438", "VD438"] },
  { id: "49", name: "Harry Potter", code: "VD439", rarity: "standard", category: "other", searchTerms: ["Harry Potter VD439", "VD439"] },
  { id: "50", name: "Hermione Granger", code: "VD440", rarity: "standard", category: "other", searchTerms: ["Hermione Granger VD440", "VD440"] }
];
