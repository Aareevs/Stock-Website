import { User } from '../types';

const STARTING_CAPITAL = 100000; // ₹1 Lakh

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya',
  'Isha', 'Kiara', 'Riya', 'Priya', 'Neha',
  'Rohan', 'Karan', 'Rahul', 'Ajay', 'Vikram',
  'Nikhil', 'Amit', 'Raj', 'Dev', 'Yash',
  'Sneha', 'Pooja', 'Nisha', 'Kavya', 'Tanvi',
  'Meera', 'Zara', 'Aisha', 'Simran', 'Divya',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta',
  'Reddy', 'Joshi', 'Mehta', 'Nair', 'Iyer',
  'Verma', 'Malhotra', 'Kapoor', 'Bhat', 'Rao',
  'Saxena', 'Desai', 'Mishra', 'Chopra', 'Banerjee',
  'Das', 'Pillai', 'Menon', 'Kulkarni', 'Srinivasan',
  'Choudhury', 'Tiwari', 'Agarwal', 'Shah', 'Pandey',
  'Bose', 'Sen', 'Mukherjee', 'Chauhan', 'Yadav',
  'Jain', 'Thakur', 'Ranganathan', 'Trivedi', 'Saini',
];

export const generateUsers = (): User[] => {
  return FIRST_NAMES.map((firstName, i) => {
    const lastName = LAST_NAMES[i];
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    return {
      id: `user-${String(i + 1).padStart(3, '0')}`,
      username,
      password: `pass${String(i + 1).padStart(3, '0')}`,
      displayName: `${firstName} ${lastName}`,
      startingCapital: STARTING_CAPITAL,
      cashBalance: STARTING_CAPITAL,
      portfolio: [],
      transactions: [],
    };
  });
};

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export const STARTING_CAPITAL_DISPLAY = '₹1 Lakh';
export { STARTING_CAPITAL };
