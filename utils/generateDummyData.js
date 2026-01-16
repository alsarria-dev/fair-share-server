const fs = require("fs");
const crypto = require("crypto");

// Function to generate a 24-character hex string
function generateObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

// Function to generate a random date between two dates
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Function to generate a random phone number
function generatePhoneNumber() {
  const digits = "0123456789";
  let phoneNumber = "+";
  for (let i = 0; i < 10; i++) {
    phoneNumber += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return phoneNumber;
}

// Function to generate a random email
function generateEmail(firstName, lastName) {
  const domains = ["example.com", "mail.com", "test.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Function to generate a random password
function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

// Predefined lists for generating data
const firstNames = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Fiona",
  "George",
  "Hannah",
  "Ivan",
  "Julia",
  "Kevin",
  "Lara",
  "Michael",
  "Nina",
  "Oscar",
  "Paula",
  "Quinn",
  "Rachel",
  "Sam",
  "Tina",
  "Uma",
  "Victor",
  "Wendy",
  "Xander",
  "Yara",
  "Zane",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Jones",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Martinez",
  "Robinson",
  "Clark",
  "Rodriguez",
  "Lewis",
  "Lee",
  "Walker",
  "Hall",
];
const tripNames = [
  "Weekend Trip",
  "Business Trip",
  "Family Vacation",
  "Road Trip",
  "Hiking Adventure",
  "Beach Getaway",
  "Mountain Retreat",
  "City Exploration",
  "Cultural Tour",
  "Foodie Excursion",
];
const tripDescriptions = [
  "Exploring the beautiful beaches and vibrant nightlife.",
  "Cost of airline tickets for the trip.",
  "Visiting family and friends in another city.",
  "Driving through scenic routes and countryside.",
  "Hiking in the mountains and enjoying nature.",
  "Relaxing at a luxury resort by the sea.",
  "Staying at a cozy cabin in the mountains.",
  "Discovering the history and architecture of the city.",
  "Experiencing the local culture and traditions.",
  "Tasting the best local cuisine and street food.",
];
const expenseNames = [
  "Hotel",
  "Flight",
  "Dinner",
  "Museum",
  "Taxi",
  "Car Rental",
  "Concert Ticket",
  "Park Entrance",
  "Souvenirs",
  "Boat Ride",
];
const expenseDescriptions = [
  "Booking a room at a comfortable hotel.",
  "Buying tickets for the flight.",
  "Having dinner at a local restaurant.",
  "Visiting the city museum.",
  "Taking a taxi to the destination.",
  "Renting a car for the trip.",
  "Attending a live concert.",
  "Entering the national park.",
  "Buying souvenirs from the market.",
  "Riding a boat along the river.",
];
const expenseConcepts = [
  "Housing",
  "Food",
  "Transportation",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Education",
  "Personal Care",
  "Savings",
];

// Generate users
const users = [];
for (let i = 0; i < 50; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const user = {
    _id: { $oid: generateObjectId() },
    name: firstName,
    lastName: lastName,
    dateOfBirth: randomDate(
      new Date(1950, 0, 1),
      new Date(2005, 0, 1),
    ).toISOString(),
    phoneNumber: generatePhoneNumber(),
    profilePic:
      "https://tgcxojdndrjkwxfwxjvw.supabase.co/storage/v1/object/public/fair-share/profile_picture_6659aedd0ba6e3a417794481_4391.png",
    email: generateEmail(firstName, lastName),
    password: generatePassword(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(user);
}

// Generate groups and expenses
const groups = [];
const expenses = [];

for (let i = 0; i < 150; i++) {
  const groupUsers = [];
  const numGroupUsers = Math.floor(Math.random() * 6) + 5; // Between 5 and 10 users
  for (let j = 0; j < numGroupUsers; j++) {
    groupUsers.push(users[Math.floor(Math.random() * users.length)]._id);
  }

  const groupAuthor = groupUsers[Math.floor(Math.random() * groupUsers.length)]; // Randomly select group author

  // Add group author to group users if not already present
  if (!groupUsers.some((user) => user["$oid"] === groupAuthor["$oid"])) {
    groupUsers.push(groupAuthor);
  }

  const groupUserIds = groupUsers.map((user) => ({ $oid: user["$oid"] }));

  const groupExpenses = [];
  for (let j = 0; j < Math.floor(Math.random() * 20) + 1; j++) {
    const expenseUsers = [];
    const numExpenseUsers = Math.min(
      Math.floor(groupUsers.length / 2) + 1,
      groupUsers.length,
    ); // At least half of the group or all of them
    for (let k = 0; k < numExpenseUsers; k++) {
      expenseUsers.push(
        groupUsers[Math.floor(Math.random() * groupUsers.length)],
      );
    }

    // Add expense author to expense users if not already present
    if (!expenseUsers.some((user) => user["$oid"] === groupAuthor["$oid"])) {
      expenseUsers.push(groupAuthor);
    }

    const expenseUserIds = expenseUsers.map((user) => ({ $oid: user["$oid"] }));

    const expense = {
      _id: { $oid: generateObjectId() },
      name: expenseNames[Math.floor(Math.random() * expenseNames.length)],
      description:
        expenseDescriptions[
          Math.floor(Math.random() * expenseDescriptions.length)
        ],
      concept:
        expenseConcepts[Math.floor(Math.random() * expenseConcepts.length)],
      amount: parseFloat((Math.random() * 990 + 10).toFixed(2)),
      group: { $oid: generateObjectId() },
      expenseAuthor: { $oid: groupAuthor["$oid"] }, // Set expense author as group author
      expenseUsers: expenseUserIds,
      expensePic:
        "https://tgcxojdndrjkwxfwxjvw.supabase.co/storage/v1/object/public/fair-share/profile_picture_6659aedd0ba6e3a417794481_795878.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expenses.push(expense);
    groupExpenses.push({ $oid: expense._id["$oid"] });
  }

  const group = {
    _id: { $oid: generateObjectId() },
    name: tripNames[Math.floor(Math.random() * tripNames.length)],
    description:
      tripDescriptions[Math.floor(Math.random() * tripDescriptions.length)],
    groupAuthor: { $oid: groupAuthor["$oid"] },
    groupUsers: groupUserIds,
    groupExpenses: groupExpenses,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  groups.push(group);
}

// Write to JSON files
fs.writeFileSync(
  "./dummy_data/dummy_users.json",
  JSON.stringify(users, null, 4),
);
fs.writeFileSync(
  "./dummy_data/dummy_groups.json",
  JSON.stringify(groups, null, 4),
);
fs.writeFileSync(
  "./dummy_data/dummy_expenses.json",
  JSON.stringify(expenses, null, 4),
);

console.log("Data files created successfully.");
