import { Product, ProductId } from '../types';

export const PRODUCTS: Record<ProductId, Product> = {
  'veg-burger': {
    id: 'veg-burger',
    name: 'Veg Burger',
    pricePaise: 9900,
    description: 'Crispy herb-potato patty layered with fresh lettuce, juicy tomatoes, and our signature tangy house sauce in a toasted sesame bun.',
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    badge: 'Popular',
    isVegetarian: true,
  },
  'paneer-wrap': {
    id: 'paneer-wrap',
    name: 'Paneer Wrap',
    pricePaise: 19900,
    description: 'Succulent spiced cottage cheese cubes grilled with crunchy bell peppers and wrapped in a wholesome whole wheat paratha with mint relish.',
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    badge: 'Chef Special',
    isVegetarian: true,
  },
  'margherita-pizza': {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    pricePaise: 24900,
    description: 'Traditional wood-fired crust topped with San Marzano tomato puree, shredded fresh mozzarella, fragrant basil leaves, and cold-pressed extra virgin olive oil.',
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    badge: 'Bestseller',
    isVegetarian: true,
  },
  'family-combo': {
    id: 'family-combo',
    name: 'Family Combo',
    pricePaise: 29900,
    description: 'Generous sharing feast featuring 1 Margherita Pizza, 1 Veg Burger, 1 Paneer Wrap, and 2 portions of seasoned crispy fries.',
    category: 'combos',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    badge: 'Value Pack',
    isVegetarian: true,
  },
  'extra-dip': {
    id: 'extra-dip',
    name: 'Extra Dip',
    pricePaise: 100,
    description: 'Creamy garlic aioli or fiery peri-peri dip — the perfect companion for burgers, wraps, and pizza crusts.',
    category: 'sides',
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
    badge: 'Add-on',
    isVegetarian: true,
  },
};

export const PRODUCT_LIST: Product[] = [
  PRODUCTS['veg-burger'],
  PRODUCTS['paneer-wrap'],
  PRODUCTS['margherita-pizza'],
  PRODUCTS['family-combo'],
  PRODUCTS['extra-dip'],
];

