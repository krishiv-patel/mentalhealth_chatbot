import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, 
  Phone, 
  Globe, 
  BookOpen, 
  MessageSquare, 
  Heart,
  ExternalLink,
  AlertTriangle,
  Flag,
  MapPin,
  Clock,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ResourceCardProps {
  title: string;
  description: string;
  contact?: string;
  website?: string;
  hours?: string;
  urgent?: boolean;
  country?: 'us' | 'india';
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  title, 
  description, 
  contact, 
  website, 
  hours,
  urgent,
  country 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-lg p-5 border ${urgent ? 'border-rose-500' : 'border-border'} hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          {country && (
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground capitalize">{country}</span>
            </div>
          )}
        </div>
        {urgent && (
          <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-xs rounded-full font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Crisis
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <div className="space-y-2">
        {contact && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-indigo-500" />
            <a 
              href={`tel:${contact.replace(/[^\d+]/g, '')}`} 
              className="text-sm text-foreground hover:underline flex items-center gap-1"
            >
              {contact}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}
        {website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal-500" />
            <a 
              href={website}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-foreground hover:underline flex items-center gap-1"
            >
              Visit Website
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {hours && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
            <span className="text-sm text-muted-foreground">{hours}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SectionHeader: React.FC<{ 
  icon: React.ReactNode;
  title: string;
  country?: string;
  description?: string;
}> = ({ icon, title, country, description }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h2 className="text-2xl font-semibold">{title}</h2>
      {country && (
        <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
          {country}
        </div>
      )}
    </div>
    {description && (
      <p className="text-muted-foreground">{description}</p>
    )}
  </div>
);

export const Resources: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Mental Health Resources</h1>
          <p className="text-muted-foreground">
            If you're experiencing a mental health crisis or need additional support beyond what 
            MindfulAI can provide, the following resources can help. For immediate danger to yourself 
            or others, please call emergency services (911 in US, 112 in India) directly.
          </p>
        </div>

        {/* USA Crisis Support */}
        <section className="mb-12">
          <SectionHeader 
            icon={<Flag className="h-6 w-6 text-rose-500" />}
            title="USA Crisis Support"
            country="United States"
            description="24/7 crisis support services available across the United States"
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <ResourceCard
              title="988 Suicide & Crisis Lifeline"
              description="24/7 support for anyone experiencing mental health-related distress - thoughts of suicide, mental health or substance use crisis, or any other emotional distress"
              contact="988"
              website="https://988lifeline.org"
              hours="Available 24/7"
              urgent={true}
              country="us"
            />
            
            <ResourceCard
              title="Crisis Text Line"
              description="Text-based crisis intervention, emotional support and resources"
              contact="Text HOME to 741741"
              website="https://www.crisistextline.org"
              hours="Available 24/7"
              urgent={true}
              country="us"
            />
            
            <ResourceCard
              title="SAMHSA's National Helpline"
              description="Treatment referral and information service for individuals facing mental health or substance use disorders"
              contact="1-800-662-4357"
              website="https://www.samhsa.gov/find-help/national-helpline"
              hours="Available 24/7, 365 days a year"
              urgent={true}
              country="us"
            />
            
            <ResourceCard
              title="Veterans Crisis Line"
              description="Connects veterans and their families with qualified responders"
              contact="988 (Press 1)"
              website="https://www.veteranscrisisline.net"
              hours="Available 24/7"
              urgent={true}
              country="us"
            />

            <ResourceCard
              title="The Trevor Project"
              description="Crisis intervention and suicide prevention for LGBTQ+ young people"
              contact="1-866-488-7386"
              website="https://www.thetrevorproject.org"
              hours="Available 24/7"
              urgent={true}
              country="us"
            />

            <ResourceCard
              title="National Domestic Violence Hotline"
              description="Support, crisis intervention, and referral service for domestic violence survivors"
              contact="1-800-799-7233"
              website="https://www.thehotline.org"
              hours="Available 24/7"
              urgent={true}
              country="us"
            />
          </div>
        </section>
        
        {/* India Crisis Support */}
        <section className="mb-12">
          <SectionHeader 
            icon={<Flag className="h-6 w-6 text-rose-500" />}
            title="India Crisis Support"
            country="India"
            description="24/7 crisis support services available across India"
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <ResourceCard
              title="Tele MANAS"
              description="Government of India's 24/7 mental health support service available in English and 20 regional languages"
              contact="14416"
              website="https://telemanas.mohfw.gov.in"
              hours="Available 24/7"
              urgent={true}
              country="india"
            />
            
            <ResourceCard
              title="Vandrevala Foundation"
              description="Crisis intervention and psychological counseling helpline for individuals across India"
              contact="9999666555"
              website="https://www.vandrevalafoundation.com"
              hours="Available 24/7"
              urgent={true}
              country="india"
            />
            
            <ResourceCard
              title="iCall (TISS)"
              description="Psychosocial helpline run by Tata Institute of Social Sciences providing free counseling for emotional distress"
              contact="022-25521111"
              website="https://icallhelpline.org"
              hours="Mon-Sat, 10am-8pm"
              urgent={true}
              country="india"
            />
            
            <ResourceCard
              title="NIMHANS Mental Health Helpline"
              description="National Institute of Mental Health and Neurosciences' helpline for psychological support and crisis intervention"
              contact="080-46110007"
              website="https://nimhans.ac.in"
              hours="Available 24/7"
              urgent={true}
              country="india"
            />

            <ResourceCard
              title="Aasra"
              description="24/7 helpline for people in emotional distress and suicidal crisis"
              contact="9820466726"
              website="http://www.aasra.info"
              hours="Available 24/7"
              urgent={true}
              country="india"
            />

            <ResourceCard
              title="Sneha Foundation"
              description="Suicide prevention organization providing emotional support to those in distress"
              contact="044-24640050"
              website="https://snehaindia.org"
              hours="Available 24/7"
              urgent={true}
              country="india"
            />
          </div>
        </section>
        
        {/* USA Online Resources */}
        <section className="mb-12">
          <SectionHeader 
            icon={<Globe className="h-6 w-6 text-indigo-500" />}
            title="USA Online Resources"
            country="United States"
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <ResourceCard
              title="National Alliance on Mental Illness (NAMI)"
              description="Nation's largest grassroots mental health organization providing advocacy, education, support and public awareness"
              contact="1-800-950-6264"
              website="https://www.nami.org"
              hours="M-F, 10am-6pm ET"
              country="us"
            />
            
            <ResourceCard
              title="Mental Health America"
              description="Community-based nonprofit dedicated to addressing the needs of those living with mental illness"
              website="https://www.mhanational.org"
              country="us"
            />
            
            <ResourceCard
              title="Anxiety and Depression Association of America"
              description="Information on prevention, treatment, and cure of anxiety, depression, and related disorders"
              website="https://adaa.org"
              country="us"
            />
            
            <ResourceCard
              title="Psychology Today Therapist Finder"
              description="Directory to find mental health professionals in your area"
              website="https://www.psychologytoday.com/us/therapists"
              country="us"
            />

            <ResourceCard
              title="National Institute of Mental Health"
              description="Federal agency for research on mental disorders providing evidence-based information"
              website="https://www.nimh.nih.gov"
              country="us"
            />

            <ResourceCard
              title="MentalHealth.gov"
              description="Government resource for mental health information and treatment locators"
              website="https://www.mentalhealth.gov"
              country="us"
            />
          </div>
        </section>

        {/* India Online Resources */}
        <section className="mb-12">
          <SectionHeader 
            icon={<Globe className="h-6 w-6 text-indigo-500" />}
            title="India Online Resources"
            country="India"
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <ResourceCard
              title="The Live Love Laugh Foundation"
              description="Foundation focused on reducing stigma and providing resources for depression and mental health awareness in India"
              website="https://www.thelivelovelaughfoundation.org"
              country="india"
            />
            
            <ResourceCard
              title="MPower Minds"
              description="Mental health initiative focusing on creating awareness, alleviating stigma, and providing support for mental health needs in India"
              contact="1800-120-820050"
              website="https://mpowerminds.com"
              hours="Available 24/7"
              country="india"
            />
            
            <ResourceCard
              title="Mann Talks"
              description="Initiative focused on empowering individuals to take charge of their mental health through professional support"
              contact="8686139139"
              website="https://www.manntalks.org"
              hours="9:00 AM - 8:00 PM, 7 days a week"
              country="india"
            />
            
            <ResourceCard
              title="Sangath"
              description="Non-profit organization working to make mental health services accessible and affordable across India"
              contact="011-41198666"
              website="https://sangath.in"
              hours="10:00 AM - 6:00 PM, 7 days a week"
              country="india"
            />

            <ResourceCard
              title="YourDOST"
              description="Online counseling and emotional wellness platform"
              website="https://yourdost.com"
              country="india"
            />

            <ResourceCard
              title="NIMHANS Digital Academy"
              description="Online mental health resources and education from India's premier mental health institute"
              website="https://nimhansdigitalacademy.in"
              country="india"
            />
          </div>
        </section>
        
        <section className="mb-12 bg-card rounded-xl p-6 border">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-500 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
              <p className="text-sm text-muted-foreground">
                These resources are provided for informational purposes only. The helplines listed include both international 
                and Indian services to support users globally. MindfulAI is not a crisis intervention service and is not a 
                substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician 
                or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </div>
          </div>
        </section>
          
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/chat">
            <Button className="gap-2 bg-gradient-to-r from-rose-500 to-indigo-500 text-white">
              <Heart className="h-4 w-4" />
              <span>Return to Chat</span>
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}; 