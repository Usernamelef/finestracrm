import React, { useState } from 'react';
import { Wine, Coffee, Martini, ChefHat } from 'lucide-react';
import '../styles/menu-nav.css';

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('antipasti');

  const menuCategories = [
    { id: 'antipasti', name: 'Antipasti' },
    { id: 'potage', name: 'Potage' },
    { id: 'primi', name: 'Primi Piatti' },
    { id: 'carni', name: 'Le Carni' },
    { id: 'pesci', name: 'I Pesci' },
    { id: 'dolci', name: 'I Dolci' },
    { id: 'speciale', name: "Spéciale D'automne" },
    { id: 'menu-soir', name: 'Menu du Soir' },
    { id: 'boissons', name: 'Boissons & Vins' }
  ];

  const menuItems = {
    antipasti: [
      {
        name: 'Vitello Tonnato',
        price: '46.-',
        descriptionFr: 'À la Génovese',
        descriptionEn: 'Veal slices with sauce at Genovese style'
      },
      {
        name: 'Carpaccio de Thon',
        price: '38.-',
        descriptionFr: 'Aux Fenouil mariné al huile, pecorino piquant et tomate Datterino',
        descriptionEn: 'Tuna carpaccio with spicy pecorino(cheese), Datterino tomatoes and olive oil marinated fennel'
      },
      {
        name: 'Carpaccio de Bœuf',
        price: '44.-',
        descriptionFr: 'Avec une mousseline et lamelles de truffe noire d\'automne',
        descriptionEn: 'Beef carpaccio with muslin and slices of truffle'
      },
      {
        name: 'Burrata',
        price: '34.-',
        descriptionFr: 'Avec légumes grillés et tomates grappe fraîches et aceto balsamique caramélisé',
        descriptionEn: 'Burrata with grilled vegetables and vine tomatoes with caramelized balsamic vinegar'
      },
      {
        name: 'Salade Roquette',
        price: '26.-',
        descriptionFr: 'Aux Artichauts à la romaine, tomates rondes et lamelles de parmesan',
        descriptionEn: 'Rocket salad with romaine artichokes, round tomatoes and parmesan slices'
      },
      {
        name: 'Poêlée d\'Artichauts',
        price: '48.-',
        descriptionFr: 'Accompagnée du Scampi, Noix de St Jacques avec son jus de langoustines',
        descriptionEn: 'Pan-fried artichokes with lobster juice, with scampi and St. Jacques scallops'
      },
      {
        name: 'Jambon San Daniele',
        price: '42.-',
        descriptionFr: 'Avec la Bufala Mozzarella – Un mariage de saveur',
        descriptionEn: 'San Daniele Ham with bufala mozzarella'
      },
      {
        name: 'Bufala alla Sicilienne',
        price: '30.-',
        descriptionFr: 'Mozzarella di bufffala, aubergine, oignon, tomate et basilic',
        descriptionEn: 'Mozzarella di buffala with eggplant, onion, tomatoes and basil'
      }
    ],
    potage: [
      {
        name: 'Potage à la courge',
        price: '28.-',
        descriptionFr: '',
        descriptionEn: ''
      }
    ],
    primi: [
      {
        name: 'Pennette à la Finestra',
        price: '38.-',
        descriptionFr: 'Artichauts poêlés, jambon San Daniele, crème, sauge, noix de muscade et thym',
        descriptionEn: 'Finestra\'s pennette (pasta) with cream and San Daniele ham, sage, nutmeg, thyme and pan-fried artichokes'
      },
      {
        name: 'Ravioli de Bœuf',
        price: '42.-',
        descriptionFr: 'Avec chanterelles dans une sauce au vin blanc, tomate Datterino et ciboulette',
        descriptionEn: 'With tomato Datterino, sauce vin blanc and chanterelle'
      },
      {
        name: 'Gnocchi Roquette',
        price: '36.-',
        descriptionFr: 'Avec crème à la Gorgonzola et roquette – Saveurs du nord de l\'Italie',
        descriptionEn: 'Rocket gnocchi with gorgonzola cream'
      },
      {
        name: 'Tortelloni à la Ricotta',
        price: '38.-',
        descriptionFr: 'Avec artichauts poêlés, sauce beurre et sauge',
        descriptionEn: 'Ricotta tortelloni with pan artichokes, butter, and sage sauce'
      },
      {
        name: 'Tagliolini Maison',
        price: '52.-',
        descriptionFr: 'Avec scampi, dans son jus de langoustines, tomates Datterino et câpres de Salina',
        descriptionEn: 'Tagliolini of the house in lobster juice, scampis, Datterino tomatoes and capers of Salina'
      },
      {
        name: 'Risotto aux Champignons',
        price: '42.-',
        descriptionFr: 'Avec Chanterelles',
        descriptionEn: ''
      }
    ],
    carni: [
      {
        name: 'Tagliata de Bœuf',
        price: '76.-',
        descriptionFr: 'Accompagnée d\'une sauce morilles, servie avec pommes de terre rôties et salade roquette',
        descriptionEn: 'Beef tagliata with rocket salad, roasted potato, morels sauce',
        origin: '(Origine Suisse)'
      },
      {
        name: 'Carré d\'Agneau',
        price: '62.-',
        descriptionFr: 'Servi avec polenta gratinée et légumes du jardin',
        descriptionEn: 'Rack of lamb, served with polenta gratinée and garden vegetables',
        origin: '(Origin Irlande)'
      },
      {
        name: 'Osso bucco à la Milanaise',
        price: '48.-',
        descriptionFr: 'Avec risotto safran',
        descriptionEn: 'Ossobucco alla milanese with saffron risotto',
        origin: '(origin Suisse)'
      }
    ],
    pesci: [
      {
        name: 'Filet de Thon Poêlé',
        price: '56.-',
        descriptionFr: 'À la Sicilienne et légumes du marche',
        descriptionEn: 'Tuna fillet served with a sicilienne and day vegetables'
      },
      {
        name: 'La Mer et la Terre',
        price: '52.-',
        descriptionFr: 'Filet de Loup, dans son jus servie avec risotto au prosecco',
        descriptionEn: 'Sea bass fillet in its own juice served with prosseco risotto',
        origin: '(Origin France)'
      }
    ],
    dolci: [
      {
        name: 'Panna cotta',
        price: '16.-',
        descriptionFr: 'Alla Amarenatta – Douceur et fraicheur',
        descriptionEn: 'Amarenatta fruit and panna cotta'
      },
      {
        name: 'Tiramisu classique au cacao',
        price: '16.-',
        descriptionFr: 'Café, cacao et mascarpone – Un trio de saveurs qui sublime le palais',
        descriptionEn: 'Traditional Tiramisu with amaretto and cocoa'
      },
      {
        name: 'Mousse au chocolat blanc',
        price: '16.-',
        descriptionFr: 'Avec orange nature, zeste doré et coulis d\'orange',
        descriptionEn: 'White chocolate mousse with natural orange, golden zest, and orange coulis'
      },
      {
        name: 'Tarte fine aux pommes caramélisée',
        price: '16.-',
        descriptionFr: 'Avec glace à la vanille',
        descriptionEn: 'Caramelized apple pie with vanilla ice cream'
      }
    ],
    'menu-soir': [
      {
        name: 'Menu du Soir',
        price: '136.- CHF',
        items: [
          {
            course: 'Entrée',
            name: 'Poêlée d\'Artichauts',
            descriptionFr: 'Scampi et Noix de St Jacques, avec son jus de langoustines',
            descriptionEn: 'Pan-fried artichokes on lobster juice with scampi\'s and St. Jacques scallops'
          },
          {
            course: 'Plat',
            name: 'Tagliata de Bœuf',
            descriptionFr: 'Sauce morilles, pommes de terre rôties, salade roquette',
            descriptionEn: 'Beef tagliata with rocket salad, roasted potato, morels sauce',
            origin: '(Origine Suisse)'
          },
          {
            course: 'Dessert',
            name: 'Tiramisu classique',
            descriptionFr: 'Au cacao',
            descriptionEn: ''
          }
        ]
      }
    ],
    speciale: [
      {
        name: 'Filet mignon de Cerf',
        price: '58.-',
        descriptionFr: 'Accompagné d\'une sauce vin rouge, ravioli à la courge, poire, Choux rouge et confiture de coing',
        descriptionEn: '',
        special: 'La Chasse'
      }
    ]
  };

  const drinkCategories = [
    {
      title: 'Apéritifs',
      items: [
        { name: 'Martini Blanc / Rouge', description: '15% – 4cl', price: '10.00 CHF' },
        { name: 'Campari', description: '23% – 4cl', price: '10.00 CHF' },
        { name: 'Pastis', description: '45% – 4cl', price: '10.00 CHF' },
        { name: 'Kir', description: '10cl', price: '14.00 CHF' },
        { name: 'Kir Royal', description: '10cl', price: '18.00 CHF' },
        { name: 'Gin-Tonic', description: '4cl', price: '18.00 CHF' },
        { name: 'Aperol Spritz', description: '2dl', price: '18.00 CHF' },
        { name: 'Vodka', description: '4cl', price: '16.00 CHF' },
        { name: 'Moët et Chandon brut', description: '1dl', price: '18.00 CHF' },
        { name: 'Prosecco brut Superiore DOCG', description: '1dl', price: '16.00 CHF' }
      ]
    },
    {
      title: 'Dynastie de la Finestra',
      subtitle: 'Bar à cocktails à partir de 18h00',
      items: [
        { name: 'Cocktail La Finestra', description: 'Italicus, Gin Malfy, sirop orange sanguine maison, citron jaune et basilic', price: '23.00 CHF' },
        { name: 'Cocktail Rosé Fizzy', description: 'Rosé, Aperol, purée framboise maison, romarin et Perrier', price: '23.00 CHF' }
      ]
    },
    {
      title: 'Bière',
      items: [
        { name: 'Peroni', description: '33cl', price: '10.00 CHF' }
      ]
    },
    {
      title: 'Boissons au verre',
      items: [
        { name: 'Lait', description: '25cl', price: '4.00 CHF' },
        { name: 'Verre d\'eau gazeuse', description: '25cl', price: '4.00 CHF' },
        { name: 'Jus de fruit', description: '25cl', price: '4.00 CHF' }
      ]
    },
    {
      title: 'Minérales & Jus de fruits',
      items: [
        { name: 'Aqua San Pellegrino', description: '50cl', price: '7.50 CHF' },
        { name: 'Aqua Panna', description: '50cl', price: '7.50 CHF' },
        { name: 'Perrier', description: '33cl', price: '7.50 CHF' },
        { name: 'Coca-Cola', description: '33cl', price: '7.50 CHF' },
        { name: 'Coca-Cola Zero', description: '33cl', price: '7.50 CHF' },
        { name: 'Thé froid citron', description: '33cl', price: '7.50 CHF' },
        { name: 'Schweppes Tonic', description: '20cl', price: '7.50 CHF' },
        { name: 'Nectar d\'orange', description: '20cl', price: '7.50 CHF' },
        { name: 'Nectar de tomate', description: '20cl', price: '7.50 CHF' },
        { name: 'Jus de pomme Ramseier', description: '33cl', price: '7.50 CHF' },
        { name: 'Jus d\'orange frais', description: '20cl', price: '9.00 CHF' },
        { name: 'San Bitter', description: '10cl', price: '6.00 CHF' },
        { name: 'Carafe d\'eau', description: '50cl', price: '4.00 CHF' }
      ]
    },
    {
      title: 'Crus au verre (vin ouvert)',
      sections: [
        {
          subtitle: 'Rosé',
          items: [
            { name: '20/26 Elena Walch', description: '1dl', price: '16.00 CHF' }
          ]
        },
        {
          subtitle: 'Rouge',
          items: [
            { name: 'Sangiovese – Toscana, Badilante 414', description: '1dl', price: '14.00 CHF' },
            { name: 'Primitivo di Puglia, Tator, IGP', description: '1dl', price: '14.00 CHF' },
            { name: 'Italo Cescon Merlot', description: '1dl', price: '14.00 CHF' }
          ]
        },
        {
          subtitle: 'Blanc',
          items: [
            { name: 'Pinot Grigio Venezie DOC Italo Cescon, 2021', description: '1dl', price: '14.00 CHF' },
            { name: 'Chardonnay Alto Adige DOC, Elena Walch, 2021', description: '1dl', price: '14.00 CHF' }
          ]
        },
        {
          subtitle: 'Pour dessert',
          items: [
            { name: 'Deltetto, Bric du Liun, Appassite de Piemonte', description: '1dl', price: '18.00 CHF' }
          ]
        }
      ]
    },
    {
      title: 'Vini Rosati',
      items: [
        { name: '20/26 Elena Walch, Vigneti Delle Dolomiti, 2023', description: '40% Pinot Noir, 40% Lagrein, 20% Merlot', price: '88.00 CHF' }
      ]
    },
    {
      title: 'Vini Bianchi',
      items: [
        { name: 'Pinot Grigio Venezie DOC Italo Cescon', description: '', price: '79.00 CHF' },
        { name: 'Chardonnay Cardelino, Alto Adige DOC, Elena Walch, 2023', description: '', price: '88.00 CHF' },
        { name: 'Deltetto, Bric du Liun, Appassite de Piemonte', description: '', price: '95.00 CHF' },
        { name: 'Sauvignon Castel Ringber, Elena Walch DOC, 2022', description: '', price: '98.00 CHF' },
        { name: 'Vistamare Toscana IGP, Ca\'Marcanda 2023', description: '', price: '138.00 CHF' },
        { name: 'Gaia & Rey Langhe DOP, Chardonnay, Gaja 2022', description: '', price: '590.00 CHF' }
      ]
    },
    {
      title: 'Vini Rossi',
      sections: [
        {
          subtitle: 'Région Veneto',
          items: [
            { name: 'Amarone Della Valpolicella DOCG Superiore, San Rustico, 2018', description: '68% Corvina, 27% Rondinella, 5% Mollinara', price: '115.00 CHF' },
            { name: 'Italo Cescon Merlot IGT, 2022', description: '100% Merlot', price: '95.00 CHF' }
          ]
        },
        {
          subtitle: 'Région Puglia',
          items: [
            { name: 'Domiziano Primitivo di Puglia, IGP', description: '', price: '72.00 CHF' }
          ]
        },
        {
          subtitle: 'Région Piemonte',
          items: [
            { name: 'Dolcetto d\'Alba DOC 2022, Figli Luigi Oddero', description: '', price: '78.00 CHF' },
            { name: 'Barbera d\'Asti DOCG Superiore 2021, Elio Perrone', description: '', price: '85.00 CHF' },
            { name: 'Oddero Langhe DOC, Nebbiolo, 2021', description: '', price: '97.00 CHF' },
            { name: 'Gaja Sito Moresco DOC 2021', description: '', price: '168.00 CHF' },
            { name: 'Gaja Barolo Dagromis DOCG 2019', description: '', price: '205.00 CHF' },
            { name: 'Gaja Barbaresco DOCG 2019', description: '', price: '420.00 CHF' }
          ]
        },
        {
          subtitle: 'Région Toscana',
          items: [
            { name: 'Badilante 414, 2020', description: '100% Sangiovese', price: '78.00 CHF' },
            { name: 'Villa Antinori 2022', description: '', price: '84.00 CHF' },
            { name: 'Bolgheri Rosso DOC 2022 I Tirreni Beccaia', description: '', price: '78.00 CHF' },
            { name: 'Le Volte Dell\'Ornellaia 2022', description: '', price: '88.00 CHF' },
            { name: 'Rosso di Montalcino DOC 2021', description: '', price: '88.00 CHF' },
            { name: 'Marchese Antinori, Chianti Classico DOCG, Riserva 2021', description: '', price: '98.00 CHF' },
            { name: 'Brunello di Montalcino DOCG 2016, Col D\'Orcia', description: 'Biologique 2019', price: '154.00 CHF' },
            { name: 'Gaja Ca\'Marcanda Magari 2021', description: '', price: '178.00 CHF' }
          ]
        },
        {
          subtitle: 'Grandes bouteilles (Toscane)',
          items: [
            { name: 'Brunello di Montalcino DOP, Pieve Santa Restituta Gaja 2018', description: '', price: '284.00 CHF' },
            { name: 'Antinori Tignanello 2021', description: '', price: '370.00 CHF' },
            { name: 'Tenuta S. Guido Sassicaia 2021', description: '', price: '620.00 CHF' },
            { name: 'Tenuta dell\'Ornellaia 2021', description: '', price: '560.00 CHF' },
            { name: 'Antinori Solaia 2018', description: '', price: '720.00 CHF' }
          ]
        }
      ]
    },
    {
      title: 'Le Bottiglie Mezzine (37,5 cl)',
      items: [
        { name: 'Villa Antinori 2019', description: '', price: '46.00 CHF' },
        { name: 'Amarone Della Valpolicella DOCG Superiore, 2016', description: '', price: '72.00 CHF' },
        { name: 'Gaja Ca\' Marcanda Magari 2020', description: '', price: '88.00 CHF' },
        { name: 'Antinori Tignanello 2022', description: '', price: '185.00 CHF' },
        { name: 'Tenuta S. Guido Sassicaia 2019', description: '', price: '270.00 CHF' },
        { name: 'Tenuta dell\'Ornellaia 2019', description: '', price: '285.00 CHF' }
      ]
    },
    {
      title: 'Le Bottiglie Magnums (150 cl)',
      items: [
        { name: 'Villa Antinori 2022', description: '', price: '168.00 CHF' },
        { name: 'Amarone Della Valpolicella DOCG Superiore, 2016', description: '', price: '215.00 CHF' },
        { name: 'Marchese Antinori, Chianti Classico Riserva 2019', description: '', price: '195.00 CHF' },
        { name: 'Brunello di Montalcino DOCG 2018, Col D\'Orcia', description: '', price: '302.00 CHF' },
        { name: 'Antinori Tignanello 2021', description: '', price: '720.00 CHF' }
      ]
    },
    {
      title: 'Champagne & Spumante',
      items: [
        { name: 'Ruinart Champagne Blanc de Blanc', description: '', price: '350.00 CHF' },
        { name: 'Ruinart Champagne Brut Rosé', description: '', price: '250.00 CHF' },
        { name: 'Laurent Perrier Brut Cuvée Rosé', description: '', price: '250.00 CHF' },
        { name: 'Moët et Chandon Brut Impérial', description: '', price: '170.00 CHF' },
        { name: 'Franciacorta Millesimato Rosé Le Quattro Terre', description: '', price: '140.00 CHF' },
        { name: 'Franciacorta Extra Brut DOCG Le Quattro Terre', description: '', price: '125.00 CHF' },
        { name: 'Bortolin Angelo Prosecco Brut Superiore Valdobbiadene DOCG 2021', description: '', price: '95.00 CHF' }
      ]
    },
    {
      title: 'Vini da Dessert',
      items: [
        { name: 'Deltetto, Bric du Liun 2016, Appassite de Piemonte', description: '', price: '95.00 CHF' }
      ]
    },
    {
      title: 'Digestifs au verre',
      items: [
        { name: 'Limoncello Maison', description: '2cl', price: '14.00 CHF' }
      ]
    },
    {
      title: 'Grappa',
      items: [
        { name: 'Berta Bric del Gaian, 2012', description: '43%', price: '26.00 CHF' },
        { name: 'Berta Tre Soli Tre, 2015', description: '43%', price: '28.00 CHF' },
        { name: 'Sassicaia', description: '40%', price: '26.00 CHF' },
        { name: 'Ornellaia', description: '42%', price: '26.00 CHF' },
        { name: 'Barolo Riserva', description: '43%', price: '21.00 CHF' },
        { name: 'Nonino di Moscato', description: '41%', price: '21.00 CHF' },
        { name: 'Tignanello', description: '42%', price: '21.00 CHF' },
        { name: 'Nonino', description: '41%', price: '14.00 CHF' },
        { name: 'Gaja Barbaresco', description: '42%', price: '28.00 CHF' },
        { name: 'Gaja Barolo', description: '42%', price: '28.00 CHF' }
      ]
    },
    {
      title: 'Liqueurs',
      items: [
        { name: 'Amaretto DiSaronno', description: '28%', price: '16.00 CHF' },
        { name: 'Sambuca', description: '40%', price: '16.00 CHF' },
        { name: 'Amaro Averna', description: '32%', price: '16.00 CHF' },
        { name: 'Williamine', description: '43%', price: '14.00 CHF' },
        { name: 'Porto', description: '19.5%', price: '12.00 CHF' },
        { name: 'Cognac Remy Martin', description: '40%', price: '18.00 CHF' },
        { name: 'Whisky Single Malt', description: '40%', price: '18.00 CHF' },
        { name: 'Whisky Blended', description: '43%', price: '16.00 CHF' },
        { name: 'Brandy', description: '38%', price: '18.00 CHF' }
      ]
    },
    {
      title: 'Boissons chaudes',
      items: [
        { name: 'Café / Expresso / Ristretto', description: '', price: '6.00 CHF' },
        { name: 'Macchiato', description: '', price: '6.50 CHF' },
        { name: 'Thé / Infusion', description: '', price: '6.50 CHF' },
        { name: 'Cappuccino', description: '', price: '7.00 CHF' },
        { name: 'Café double', description: '', price: '7.00 CHF' }
      ]
    }
  ];

  const renderDrinkSection = (section: any, index: number) => {
    return (
      <div key={index} className="mb-8 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
        <h3 className="text-2xl font-serif font-bold text-primary mb-2">{section.title}</h3>
        {section.subtitle && (
          <p className="text-sm text-gray-600 italic mb-4">{section.subtitle}</p>
        )}
        
        {section.sections ? (
          <div className="space-y-6">
            {section.sections.map((subsection: any, subIndex: number) => (
              <div key={subIndex}>
                <h4 className="text-lg font-semibold text-accent mb-3">{subsection.subtitle}</h4>
                <div className="space-y-3">
                  {subsection.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-primary text-sm">{item.name}</h5>
                        {item.description && (
                          <p className="text-xs text-gray-600">{item.description}</p>
                        )}
                      </div>
                      <span className="text-accent font-bold text-sm ml-4">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {section.items.map((item: any, itemIndex: number) => (
              <div key={itemIndex} className="flex justify-between items-start border-b border-gray-100 pb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-primary text-sm">{item.name}</h4>
                  {item.description && (
                    <p className="text-xs text-gray-600">{item.description}</p>
                  )}
                </div>
                <span className="text-accent font-bold text-sm ml-4">{item.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif font-bold text-primary mb-6 animate-fade-in-up">
              Notre Menu
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Découvrez nos spécialités italiennes préparées avec passion et des ingrédients 
              d'exception importés directement d'Italie.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Menu Content */}
            <div className="lg:w-3/4">
              {/* Category Navigation */}
              <div className="nav-tabs flex-wrap mb-20 justify-center">
                {menuCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`nav-tab ${
                      activeCategory === category.id
                        ? 'active'
                        : ''
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Menu Items */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-serif font-bold text-primary mb-12 text-center pt-4">
                  {menuCategories.find(cat => cat.id === activeCategory)?.name}
                </h2>
                
                {activeCategory === 'boissons' ? (
                  // Drinks Menu
                  <div className="space-y-8">
                    {drinkCategories.map((section, index) => renderDrinkSection(section, index))}
                    
                    {/* Allergen Information */}
                    <div className="mt-12 p-6 bg-secondary rounded-lg">
                      <h3 className="text-lg font-bold text-primary mb-4">Prix en CHF, TVA incluse</h3>
                    </div>
                  </div>
                ) : activeCategory === 'menu-soir' ? (
                  // Evening Menu
                  <div className="space-y-8">
                    {menuItems['menu-soir'].map((menu, index) => (
                      <div key={index} className="animate-fade-in-up">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-primary mb-2">{menu.name}</h3>
                          <p className="text-3xl font-bold text-accent">{menu.price}</p>
                        </div>
                        
                        <div className="space-y-6">
                          {menu.items.map((item: any, itemIndex: number) => (
                            <div key={itemIndex} className="border-b border-gray-200 pb-4">
                              <div className="flex items-center mb-2">
                                <span className="bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold mr-3">
                                  {item.course}
                                </span>
                                <h4 className="text-xl font-bold text-primary">{item.name}</h4>
                              </div>
                              <p className="text-gray-700 mb-1">{item.descriptionFr}</p>
                              <p className="text-gray-600 text-sm italic">{item.descriptionEn}</p>
                              {item.origin && (
                                <p className="text-xs text-gray-500 mt-1">{item.origin}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Food Menu
                  <div className="space-y-6">
                    {activeCategory === 'speciale' && (
                      <div className="mb-8 space-y-6">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg overflow-hidden border-l-4 border-amber-600">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                            <div className="flex flex-col justify-center">
                              <div className="inline-block bg-white rounded-full p-3 mb-3 shadow-md w-fit">
                                <ChefHat className="text-amber-600" size={32} />
                              </div>
                              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                                Menu d'automne - La Chasse
                              </h3>
                              <p className="text-gray-700 leading-relaxed">
                                Découvrez notre menu de saison mettant à l'honneur les saveurs authentiques de l'automne
                              </p>
                            </div>
                            <div className="relative h-48 md:h-full rounded-lg overflow-hidden">
                              <img
                                src="/lafinestra-geneve-restaurant-carre-agneau-polenta.jpg"
                                alt="Menu de chasse"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg overflow-hidden border-l-4 border-yellow-600">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                            <div className="relative h-48 md:h-full rounded-lg overflow-hidden order-2 md:order-1">
                              <img
                                src="/assets/truffe-alba.jpeg"
                                alt="Truffe blanche d'Alba"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col justify-center order-1 md:order-2">
                              <div className="inline-block bg-white rounded-full p-3 mb-3 shadow-md w-fit">
                                <span className="text-3xl">🍄</span>
                              </div>
                              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                                Truffe Blanche d'Alba
                              </h3>
                              <p className="text-gray-700 leading-relaxed">
                                Le diamant blanc de la gastronomie italienne. Disponible en saison.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {menuItems[activeCategory as keyof typeof menuItems].map((item: any, index: number) => (
                      <div 
                        key={index}
                        className="border-b border-gray-200 pb-6 last:border-b-0 animate-fade-in-up"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-primary">{item.name}</h3>
                          <span className="text-xl font-bold text-accent ml-4">{item.price}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-gray-700 leading-relaxed">{item.descriptionFr}</p>
                          <p className="text-gray-600 text-sm italic leading-relaxed">{item.descriptionEn}</p>
                          {item.origin && (
                            <p className="text-xs text-gray-500">{item.origin}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Allergen Information for Food */}
                    {activeCategory !== 'boissons' && (
                      <div className="mt-12 p-6 bg-secondary rounded-lg">
                        <h3 className="text-lg font-bold text-primary mb-4">Déclaration des allergènes</h3>
                        <div className="space-y-2 text-sm">
                          <p><strong>FR :</strong> Pour plus d'information sur les allergènes dans vos plats, veuillez-vous adresser à notre personnel.</p>
                          <p><strong>EN :</strong> For more information on allergens in your dishes, please contact our staff.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Wine Selection Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <div className="flex items-center mb-6">
                  {activeCategory === 'boissons' ? (
                    <Martini className="text-accent mr-3" size={28} />
                  ) : (
                    <Wine className="text-accent mr-3" size={28} />
                  )}
                  <h3 className="text-xl font-serif font-bold text-primary">
                    {activeCategory === 'boissons' ? 'Nos Spécialités' : 'Sélection de Vins'}
                  </h3>
                </div>
                
                {activeCategory === 'boissons' ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-6">
                      Découvrez nos cocktails signature et notre sélection de vins d'exception.
                    </p>
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Cocktail La Finestra</h4>
                        <p className="text-xs text-gray-600">Notre signature</p>
                        <p className="text-accent font-bold text-sm mt-1">23.00 CHF</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Sassicaia 2021</h4>
                        <p className="text-xs text-gray-600">Toscane d'exception</p>
                        <p className="text-accent font-bold text-sm mt-1">620.00 CHF</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Limoncello Maison</h4>
                        <p className="text-xs text-gray-600">Fait maison</p>
                        <p className="text-accent font-bold text-sm mt-1">14.00 CHF</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-6">
                      Découvrez notre sélection de vins italiens soigneusement choisis par notre sommelier.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Chianti Classico DOCG</h4>
                        <p className="text-xs text-gray-600">Toscane</p>
                        <p className="text-accent font-bold text-sm mt-1">98.00 CHF</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Barolo DOCG</h4>
                        <p className="text-xs text-gray-600">Piémont</p>
                        <p className="text-accent font-bold text-sm mt-1">205.00 CHF</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Prosecco Valdobbiadene</h4>
                        <p className="text-xs text-gray-600">Vénétie</p>
                        <p className="text-accent font-bold text-sm mt-1">95.00 CHF</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <h4 className="font-semibold text-primary text-sm">Brunello di Montalcino</h4>
                        <p className="text-xs text-gray-600">Toscane</p>
                        <p className="text-accent font-bold text-sm mt-1">154.00 CHF</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-secondary rounded-lg">
                  <p className="text-xs text-gray-700 text-center">
                    <strong>Conseil du sommelier :</strong><br />
                    {activeCategory === 'boissons' 
                      ? 'Demandez nos accords cocktails-plats pour une expérience unique.'
                      : 'Demandez nos accords mets-vins personnalisés pour sublimer votre repas.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dishes Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-primary mb-6 animate-fade-in-up">
              Galerie des plats
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Un aperçu de nos plats emblématiques, entre tradition italienne et raffinement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0s'}}>
              <img
                src="/assets/lafinestra-geneve-restaurant-glace-truffes-blanches.jpg"
                alt="Glace aux truffes blanches du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <img
                src="/assets/lafinestra-geneve-restaurant-scampi-saint-jacques-artichauts.jpg"
                alt="Scampi et Saint-Jacques aux artichauts du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <img
                src="/assets/lafinestra-geneve-restaurant-carre-agneau-polenta-legumes.jpg"
                alt="Carré d'agneau avec polenta et légumes du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <img
                src="/assets/lafinestra-geneve-restaurant-foie-de-veau-venitienne-risotto.jpg"
                alt="Foie de veau à la vénitienne avec risotto du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <img
                src="/assets/lafinestra-geneve-restaurant-tiramisu-chocolat-cafe.jpg"
                alt="Tiramisu au chocolat et café du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <img
                src="/lafinestra-geneve-restaurant-tiramisu-classique-cacao.jpg"
                alt="Tiramisu classique au cacao du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <img
                src="/lafinestra-geneve-restaurant-foie-de-veau-venitienne.jpg"
                alt="Foie de veau à la vénitienne du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.7s'}}>
              <img
                src="/lafinestra-geneve-restaurant-carre-agneau-polenta.jpg"
                alt="Carré d'agneau avec polenta du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <img
                src="/lafinestra-geneve-restaurant-artichauts-scampi-saint-jacques.jpg"
                alt="Artichauts avec scampi et Saint-Jacques du restaurant La Finestra"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Menu;