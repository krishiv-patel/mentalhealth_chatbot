import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { ArrowLeft, MessageSquare, BookOpen, Heart, Shield, HeartPulse, Brain } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 gradient-text">About MindfulAI</h1>
        
        <div className="space-y-8">
          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              <span>Our Mission</span>
            </h2>
            <p className="text-muted-foreground mb-4">
              MindfulAI is dedicated to making mental health support accessible to everyone. 
              We've created an AI companion that offers emotional support, evidence-based techniques, 
              and a safe space to explore your thoughts and feelings.
            </p>
            <p className="text-muted-foreground">
              While not a replacement for professional therapy, our AI provides immediate support 
              when you need someone to talk to, practical coping strategies, and resources for 
              maintaining mental wellbeing.
            </p>
          </section>
          
          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              <span>Our Approach</span>
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-sm">1</div>
                <div>
                  <h3 className="font-medium">Active Listening</h3>
                  <p className="text-muted-foreground">Our AI provides a judgment-free environment to express yourself and feel heard.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">2</div>
                <div>
                  <h3 className="font-medium">Evidence-Based Techniques</h3>
                  <p className="text-muted-foreground">We incorporate principles from cognitive behavioral therapy (CBT), mindfulness, and positive psychology.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">3</div>
                <div>
                  <h3 className="font-medium">Personalized Support</h3>
                  <p className="text-muted-foreground">Our conversations adapt to your needs and concerns to provide relevant guidance.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-sm">4</div>
                <div>
                  <h3 className="font-medium">Resource Guidance</h3>
                  <p className="text-muted-foreground">We connect you with appropriate mental health resources when additional support is needed.</p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-500" />
              <span>Privacy & Ethics</span>
            </h2>
            <p className="text-muted-foreground mb-4">
              Your privacy is our priority. Conversations with MindfulAI are confidential and 
              protected by strong encryption. We never share your personal information or conversation 
              details with third parties.
            </p>
            <p className="text-muted-foreground">
              We're committed to ethical AI development and transparency. Our system is designed 
              to promote wellbeing while clearly communicating its capabilities and limitations as 
              an AI support tool.
            </p>
          </section>
          
          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <span>How We Can Help</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-rose-500 mb-2">Stress & Anxiety</h3>
                <p className="text-sm text-muted-foreground">Learn coping strategies for managing daily stress and anxiety symptoms</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-blue-500 mb-2">Mood Support</h3>
                <p className="text-sm text-muted-foreground">Explore techniques for improving mood and addressing feelings of sadness</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-amber-500 mb-2">Mindfulness Practice</h3>
                <p className="text-sm text-muted-foreground">Guided exercises to help you stay present and reduce rumination</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-500 mb-2">Sleep Improvement</h3>
                <p className="text-sm text-muted-foreground">Suggestions for better sleep hygiene and relaxation techniques</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-teal-500 mb-2">Self-Esteem</h3>
                <p className="text-sm text-muted-foreground">Work on building positive self-image and challenging negative self-talk</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-purple-500 mb-2">Crisis Resources</h3>
                <p className="text-sm text-muted-foreground">Quick access to hotlines and resources when immediate help is needed</p>
              </div>
            </div>
          </section>
        </div>
        
        <div className="bg-muted/30 p-6 rounded-xl mt-12 border">
          <h2 className="text-xl font-semibold mb-3 text-center">Important Disclaimer</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            MindfulAI is designed to provide support and information, but is not a replacement for 
            professional mental health care. If you're experiencing a crisis or need immediate help, 
            please contact a mental health professional, call a crisis hotline, or go to your local 
            emergency room.
          </p>
          <div className="flex justify-center">
            <Link to="/resources">
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Crisis Resources</span>
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex justify-center mt-12">
          <Link to="/chat">
            <Button className="gap-2 bg-gradient-to-r from-rose-500 to-indigo-500 text-white px-8">
              <Heart className="h-4 w-4" />
              <span>Start Chatting</span>
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}; 