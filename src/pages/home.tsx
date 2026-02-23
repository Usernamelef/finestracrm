import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Star, Calendar, Award, ChefHat } from 'lucide-react';

const preloadImages = [
  '/lafinestra-geneve-restaurant-devanture-bois.jpg',
  '/assets/lafinestra-geneve-logo-blanc.png'
];

const preloadImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

const Home = () => {
  useEffect(() => {
    preloadImages.forEach(preloadImage);
  }, []);

  const testimonials = [
    {
      name: "Céline M.",
      date: "Novembre 2024",
      rating: 5,
      comment: "Excellents gnocchis et penne ! Cuisine fine et raffinée, chantante et subtile. Service parfait, serveurs très attentifs, affables et discrets. Cadre chaleureux et élégant."
    },
    {
      name: "Morgan J.",
      date: "Septembre 2024",
      rating: 5,
      comment: "Service impeccable, cuisine et atmosphère exceptionnelles ! Les gnocchis et panna cotta sont un 10/10. Parfait pour un dîner romantique, je recommande vivement."
    },
    {
      name: "Steve S.",
      date: "Mars 2024",
      rating: 5,
      comment: "Meilleure cuisine italienne de Genève ! Les tortellini aux artichauts frits étaient exceptionnels. Ma femme a adoré le tartuffo. Service attentionné et chaleureux."
    }
  ];

  const specialties = [
    {
      name: "Carré d'Agneau",
      descriptionFr: "Servi avec polenta gratinée et légumes du jardin",
      descriptionEn: "Rack of lamb, served with polenta gratinée and garden vegetables",
      image: "/lafinestra-geneve-restaurant-carre-agneau-polenta.jpg"
    },
    {
      name: "Poêlée d'Artichauts",
      descriptionFr: "Accompagnée du Scampi, Noix de St Jacques, avec son jus de langoustines",
      descriptionEn: "Pan-fried artichokes with lobster juice, with scampi and St. Jacques scallops",
      image: "/lafinestra-geneve-restaurant-artichauts-scampi-saint-jacques.jpg"
    },
    {
      name: "Foie de Veau à la Vénitienne",
      descriptionFr: "Accompagné d'un risotto au prosecco et parmesan",
      descriptionEn: "Veal liver at the Venetian, accompanied by parmesan and prosecco risotto",
      image: "/lafinestra-geneve-restaurant-foie-de-veau-venitienne.jpg"
    },
    {
      name: "Tiramisu classique au cacao",
      descriptionFr: "Café, cacao et mascarpone, un trio de saveurs qui sublime le palais",
      descriptionEn: "Traditional Tiramisu with amaretto and cocoa",
      image: "/lafinestra-geneve-restaurant-tiramisu-classique-cacao.jpg"
    }
  ];

  const restaurantGallery = [
    {
      src: '/lafinestra-geneve-restaurant-table-romantique-coeur.jpg',
      alt: 'Table romantique du restaurant La Finestra avec décoration en forme de cœur et bougies',
      category: 'exterieur'
    },
    {
      src: '/lafinestra-geneve-restaurant-terrasse-rue-gastronomique.jpg',
      alt: 'Terrasse du restaurant La Finestra dans une rue gastronomique de Genève avec parasols et tables dressées',
      category: 'terrasse'
    },
    {
      src: '/lafinestra-geneve-restaurant-table-gastronomique.jpg',
      alt: 'Table gastronomique du restaurant La Finestra avec verres à vin et cave à vins en arrière-plan',
      category: 'exterieur'
    },
    {
      src: '/lafinestra-geneve-restaurant-terrasse-parasols-menu.jpg',
      alt: 'Terrasse du restaurant La Finestra avec parasols blancs et menu affiché',
      category: 'terrasse'
    },
    {
      src: '/lafinestra-geneve-restaurant-vieille-ville-rue.jpg',
      alt: 'Restaurant La Finestra dans la vieille ville de Genève avec terrasse sur rue pavée',
      category: 'exterieur'
    },
    {
      src: '/lafinestra-geneve-restaurant-terrasse-soiree-lanterne.jpg',
      alt: 'Terrasse du restaurant La Finestra en soirée avec lanternes et ambiance chaleureuse',
      category: 'terrasse'
    },
  ];

  return (
    <div className="animate-fade-in">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(68, 15, 30, 0.35), rgba(68, 15, 30, 0.35)), url('/lafinestra-geneve-restaurant-devanture-bois.jpg')`
          }}
        />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <img
              src="/assets/lafinestra-geneve-logo-blanc.png"
              alt="La Finestra Genève"
              className="h-24 sm:h-28 md:h-36 lg:h-44 w-auto"
              loading="eager"
              decoding="async"
              style={{
                filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.4))'
              }}
            />
          </div>
          <p className="text-xl md:text-2xl mb-8 font-light animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <span className="hidden sm:inline">Une fenêtre sur l'Italie - </span>Cuisine italienne traditionnelle à Genève depuis 2006
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <Link
              to="/reservations"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Réserver une table
            </Link>
            <Link
              to="/menu"
              className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Découvrir notre menu
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce-gentle">
          <ChevronDown size={32} />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h2 className="text-4xl font-serif font-bold text-primary mb-6">
                L'amour de l'Italie dans chaque assiette
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Depuis 2006, La Finestra vous invite à découvrir l'authenticité de la cuisine italienne
                dans un cadre <strong>chaleureux et romantique</strong>, au cœur de Genève. Ce restaurant gastronomique met à l'honneur les
                <strong> plats à base de truffe</strong>, élaborés avec passion par notre chef.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Chaque plat est préparé avec des ingrédients frais importés d'Italie,
                dans le respect des recettes traditionnelles transmises de génération en génération.
              </p>
              <Link
                to="/about"
                className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                En savoir plus
              </Link>
            </div>

            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <img
                src="/lafinestra-geneve-restaurant-terrasse-soiree-lanterne.jpg"
                alt="Terrasse du restaurant La Finestra en soirée avec lanternes et ambiance chaleureuse"
                className="rounded-lg shadow-xl w-full h-96 object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 relative overflow-hidden rounded-lg shadow-xl">
                  <img
                    src="/assets/truffe-blanche.jpeg"
                    alt="Truffes blanches et noires d'Alba"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="relative overflow-hidden rounded-lg shadow-lg">
                  <img
                    src="/assets/truffe-blanche-alba.jpeg"
                    alt="Truffe blanche d'Alba"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="relative overflow-hidden rounded-lg shadow-lg">
                  <img
                    src="/assets/truffe-alba-blanche.jpeg"
                    alt="Truffes d'Alba blanches"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="animate-fade-in-up order-1 lg:order-2" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-xl p-8 border-t-4 border-yellow-600">
                <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                  Truffe Blanche d'Alba
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  La Finestra célèbre l'excellence avec la truffe blanche d'Alba,
                  le diamant blanc de la gastronomie italienne. Récoltée dans les collines
                  du Piémont, cette truffe rare et précieuse sublime nos plats avec son arôme
                  intense et unique.
                </p>

                <div className="bg-white rounded-lg p-6 mb-6 border-l-4 border-yellow-600">
                  <p className="text-gray-800 italic">
                    Disponible en saison, nos plats à la truffe sont préparés avec passion
                    pour vous offrir une expérience gastronomique inoubliable.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/menu"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                  >
                    Découvrir nos plats à la truffe
                  </Link>
                  <Link
                    to="/reservations"
                    className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                  >
                    Réserver
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <ChefHat className="text-accent mr-3" size={32} />
              <h2 className="text-4xl font-serif font-bold text-primary animate-fade-in-up">
                Nos spécialités
              </h2>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Découvrez nos plats signature, préparés avec passion
              et des ingrédients d'exception importés directement d'Italie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {specialties.map((dish, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden group animate-fade-in-up"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-primary mb-3">{dish.name}</h3>
                  <p className="text-gray-700 text-sm mb-2 leading-relaxed">
                    {dish.descriptionFr}
                  </p>
                  <p className="text-gray-600 text-xs italic leading-relaxed">
                    {dish.descriptionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/menu"
              className="inline-flex items-center space-x-2 bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
              style={{animationDelay: '0.8s'}}
            >
              <ChefHat size={20} />
              <span>Voir tout le menu</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-primary mb-6 animate-fade-in-up">
              Découvrez notre restaurant
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Entre tradition et élégance, La Finestra vous accueille dans un cadre authentique
              avec sa terrasse charmante et son intérieur chaleureux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {restaurantGallery.map((image, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-lg shadow-lg group animate-fade-in-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg capitalize">
                    {image.category === 'facade' ? 'Façade' :
                     image.category === 'terrasse' ? 'Terrasse' :
                     image.category === 'interieur' ? 'Intérieur' :
                     image.category === 'exterieur' ? 'Extérieur' : 'Intérieur'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Terrasse charmante</h3>
              <p className="text-gray-700">
                Profitez de notre terrasse dans une rue pavée typiquement genevoise,
                parfaite pour les beaux jours.
              </p>
            </div>

            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🕯️</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Ambiance intimiste</h3>
              <p className="text-gray-700">
                Un intérieur chaleureux avec un éclairage tamisé et une décoration
                soignée pour des moments inoubliables.
              </p>
            </div>

            <div className="text-center animate-fade-in-up" style={{animationDelay: '1s'}}>
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🍷</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Art de la table</h3>
              <p className="text-gray-700">
                Chaque table est dressée avec soin, alliant tradition italienne
                et raffinement contemporain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="flex justify-center mb-4">
                <Calendar className="text-secondary" size={48} />
              </div>
              <h3 className="text-4xl font-bold text-secondary mb-2">2006</h3>
              <p className="text-xl">Depuis plus de 19 ans</p>
            </div>

            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="flex justify-center mb-4">
                <Award className="text-secondary" size={48} />
              </div>
              <h3 className="text-4xl font-bold text-secondary mb-2">100%</h3>
              <p className="text-xl">Traditionnel</p>
            </div>

            <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="flex justify-center mb-4">
                <Star className="text-secondary" size={48} />
              </div>
              <h3 className="text-4xl font-bold text-secondary mb-2">5★</h3>
              <p className="text-xl">Excellence</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-primary mb-12">
            Ce que disent nos clients
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg animate-fade-in-up"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
                <div>
                  <p className="font-semibold text-primary">– {testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-primary mb-6 animate-fade-in-up">
            Réservez votre table
          </h2>
          <p className="text-xl text-gray-700 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Venez découvrir l'authenticité de la cuisine italienne dans notre cadre chaleureux.
            Que ce soit en terrasse ou dans notre salle, nous vous promettons une expérience mémorable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <Link
              to="/reservations"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Réserver maintenant
            </Link>
            <Link
              to="/events"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Événements privés
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
