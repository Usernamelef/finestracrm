import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, MapPin, Star, Utensils, Heart } from 'lucide-react';

const Events = () => {
  const eventTypes = [
    {
      icon: <Utensils className="text-accent" size={32} />,
      title: 'Repas d\'affaires',
      description: 'Environnement professionnel et discret pour vos réunions d\'affaires importantes.'
    },
    {
      icon: <Heart className="text-accent" size={32} />,
      title: 'Anniversaires',
      description: 'Célébrez vos moments spéciaux dans un cadre chaleureux et authentique.'
    },
    {
      icon: <Users className="text-accent" size={32} />,
      title: 'Événements familiaux',
      description: 'Réunions de famille, baptêmes, communions dans une ambiance conviviale.'
    },
    {
      icon: <Calendar className="text-accent" size={32} />,
      title: 'Événements corporatifs',
      description: 'Séminaires, lancements de produits, team building avec service personnalisé.'
    }
  ];

  const testimonials = [
    {
      name: 'Philippe Dubois',
      company: 'Directeur Commercial, TechSolutions SA',
      comment: 'La salle privée de La Finestra a été parfaite pour notre réunion annuelle. Service impeccable et cuisine exceptionnelle. Nos clients internationaux ont été enchantés.',
      rating: 5
    },
    {
      name: 'Marie-Claire Laurent',
      event: 'Anniversaire de mariage',
      comment: 'Nous avons organisé nos 25 ans de mariage à La Finestra. L\'équipe a été aux petits soins, l\'ambiance était magique et tous nos invités nous en parlent encore.',
      rating: 5
    }
  ];

  const gallery = [
    {
      src: '/lafinestra-geneve-truffes-noires-blanches-assiette.jpg',
      alt: 'Présentation de truffes noires et blanches sur assiette au restaurant La Finestra'
    },
    {
      src: '/lafinestra-geneve-salle-restaurant-table-orange.jpg',
      alt: 'Salle du restaurant La Finestra avec tables et banquettes orange'
    },
    {
      src: '/lafinestra-geneve-decoration-florale-table.jpg',
      alt: 'Décoration florale raffinée sur table du restaurant La Finestra'
    },
    {
      src: '/lafinestra-geneve-salle-intime-table-romantique.jpg',
      alt: 'Salle intime avec table romantique du restaurant La Finestra'
    },
    {
      src: '/lafinestra-geneve-table-preparee-verres-vins.jpg',
      alt: 'Table préparée avec verres à vin au restaurant La Finestra'
    },
    {
      src: '/lafinestra-geneve-table-preparee-verres-vins2.jpg',
      alt: 'Table élégamment dressée avec verres à vin et décoration florale au restaurant La Finestra'
    },
    {
      src: '/lafinestra-geneve-interieur-chaleureux-boiserie copy.jpg',
      alt: 'Intérieur chaleureux avec boiseries et ambiance feutrée du restaurant La Finestra'
    },
    {
      src: '/lafinestra-geneve-ambiance-authentique copy.jpg',
      alt: 'Ambiance authentique et raffinée de la salle événementielle La Finestra'
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(68, 15, 30, 0.6), rgba(68, 15, 30, 0.6)), url('/lafinestra-geneve-interieur-chaleureux-boiserie.jpg')`
          }}
        />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 animate-fade-in-up">
            Une salle événementielle et de conférence au cœur de Genève
          </h1>
          <p className="text-xl md:text-2xl mb-8 font-light animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Un cadre d'exception pour vos moments les plus précieux
          </p>
          
          <Link
            to="/reservations"
            className="inline-block bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
            style={{animationDelay: '0.4s'}}
          >
            Réserver la salle
          </Link>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h2 className="text-4xl font-serif font-bold text-primary mb-6">
                Une salle d'exception
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Notre salle privée peut accueillir jusqu'à 45 personnes dans un cadre élégant et chaleureux. 
                Avec ses banquettes en velours, son éclairage tamisé et sa décoration soignée, 
                elle offre l'atmosphère parfaite pour tous vos événements.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <Users className="text-accent mx-auto mb-2" size={32} />
                  <h3 className="font-semibold text-primary">Jusqu'à 45 personnes</h3>
                  <p className="text-sm text-gray-600">Capacité modulable</p>
                </div>
                
                <div className="text-center">
                  <MapPin className="text-accent mx-auto mb-2" size={32} />
                  <h3 className="font-semibold text-primary">Salle privée</h3>
                  <p className="text-sm text-gray-600">Espace dédié et isolé</p>
                </div>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                Notre équipe expérimentée vous accompagne dans l'organisation de votre événement, 
                depuis la conception du menu jusqu'au service personnalisé, pour faire de votre 
                réception un moment inoubliable.
              </p>
            </div>
            
            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <img
                src="/lafinestra-geneve-ambiance-authentique.jpg"
                alt="Ambiance authentique de la salle événementielle La Finestra"
                className="rounded-lg shadow-xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-primary mb-12">
            Types d'événements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {eventTypes.map((type, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg text-center animate-fade-in-up"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="flex justify-center mb-4">
                  {type.icon}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{type.title}</h3>
                <p className="text-gray-700 text-sm">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-primary mb-12">
            Témoignages d'événements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-secondary p-8 rounded-lg shadow-lg animate-fade-in-up"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-lg">"{testimonial.comment}"</p>
                <div>
                  <p className="font-semibold text-primary">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">
                    {testimonial.company || testimonial.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-primary mb-12">
            Galerie de la salle événementielle
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((image, index) => (
              <div 
                key={index}
                className="relative overflow-hidden rounded-lg shadow-lg animate-fade-in-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-700 text-lg max-w-3xl mx-auto">
              Découvrez l'élégance et le raffinement de notre salle événementielle. 
              Chaque détail a été pensé pour créer une atmosphère unique et mémorable 
              pour vos occasions spéciales.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold mb-6 animate-fade-in-up">
            Prêt à organiser votre événement ?
          </h2>
          <p className="text-xl mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Contactez-nous pour discuter de vos besoins et créer ensemble un événement sur mesure.
          </p>
          <Link
            to="/reservations"
            className="inline-block bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
            style={{animationDelay: '0.4s'}}
          >
            Réserver maintenant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Events;