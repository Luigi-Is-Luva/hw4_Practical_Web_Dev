require('dotenv').config();
const dns      = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const Menu     = require('./models/Menu');

const menuItems = [
  { name: "Soupe à l'Oignon",  ingredients: "onions beef broth baguette crouton gruyère cheese",                          price: 8.99,  imageKey: 'soupealoignon'     },
  { name: 'Croissant au Jambon', ingredients: 'croissant dough ham dijon mustard swiss cheese',                            price: 6.49,  imageKey: 'CroissantauJambon'  },
  { name: 'Quiche Lorraine',     ingredients: 'shortcrust pastry bacon lardons eggs cream gruyère',                        price: 11.99, imageKey: 'QuicheLorraine'     },
  { name: 'Boeuf Bourguignon',   ingredients: 'beef chuck red wine carrots mushrooms pearl onions thyme',                  price: 18.99, imageKey: 'BoeufBourguignon'  },
  { name: 'Ratatouille',         ingredients: 'zucchini eggplant bell peppers tomatoes olive oil herbes de Provence',      price: 13.49, imageKey: 'Ratatouille'        },
  { name: 'Poulet Provençal',    ingredients: 'chicken thighs tomatoes olives garlic rosemary white wine',                 price: 16.99, imageKey: 'PouletProvencal'   },
  { name: 'Crêpes Suzette',      ingredients: 'flour eggs milk butter orange zest Grand Marnier',                          price: 9.49,  imageKey: 'CrêpesSuzette'     },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB');

  await Menu.deleteMany({});
  console.log('Cleared existing menu items');

  const inserted = await Menu.insertMany(menuItems);
  console.log(`Seeded ${inserted.length} menu items`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
