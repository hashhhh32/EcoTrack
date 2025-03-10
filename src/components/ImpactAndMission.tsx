import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Globe2, Users, Recycle, Award, TreePine, Scale, Heart, ChevronDown, ChevronUp, Github, Linkedin, Mail, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const teamMembers = [
  {
    name: "Harsh Chaurasia",
    role: "Full Stack Developer",
    photo: "/team/harsh.jpg", // Placeholder - will be updated
    github: "https://github.com/hashhhh32",
    linkedin: "https://www.linkedin.com/in/harshhchaurasia05/",
    email: "harshu96190@gmail.com"
  },
  {
    name: "Shubham Bhandary",
    role: "Backend Developer",
    photo: "/team/shubham.jpg", // Placeholder - will be updated
    github: "https://github.com/shubhamb025",
    linkedin: "https://www.linkedin.com/in/shubham-bhandary-161a3a290/",
    email: "shubhambhandary025@gmail.com"
  },
  {
    name: "Dhruv Kulkarni",
    role: "Frontend Developer & Penetration Tester",
    photo: "/team/dhruv.jpg", // Placeholder - will be updated
    github: "https://github.com/dhruvk294",
    linkedin: "https://www.linkedin.com/in/dhruvkulkarni294/",
    email: "dhruvkulkarni294@gmail.com"
  },
  {
    name: "Sumedh Chandra",
    role: "UI/UX Designer",
    photo: "/team/sumedh.jpg", // Placeholder - will be updated
    github: "https://github.com/sumedhchandra",
    linkedin: "https://www.linkedin.com/in/sumedh-chandra-b150362b3/",
    email: "sumedhchandra05@gmail.com"
  }
];

const ImpactAndMission = () => {
  const navigate = useNavigate();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/80">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-12">
          <Button
            variant="outline"
            size="default"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-background/95 border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-primary/5 hover:border-primary/30"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Previous Page</span>
          </Button>
        </div>

        {/* Mission Statement */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
            Transforming Waste Management,
            <br />
            One Action at a Time
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            EcoTrack is revolutionizing how communities approach waste management through technology, 
            engagement, and rewards. Together, we're building a cleaner, more sustainable future.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Recycle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">50,000+</h3>
              <p className="text-muted-foreground">Tons of Waste Recycled</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">100,000+</h3>
              <p className="text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TreePine className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">25,000+</h3>
              <p className="text-muted-foreground">Trees Saved</p>
            </CardContent>
          </Card>
        </div>

        {/* Our Approach */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Approach to Sustainability</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Globe2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Impact</h3>
              <p className="text-muted-foreground">
                Making a worldwide difference through local actions
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Community First</h3>
              <p className="text-muted-foreground">
                Empowering communities to take environmental action
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Rewards Program</h3>
              <p className="text-muted-foreground">
                Incentivizing sustainable practices through recognition
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Scale className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Measurable Impact</h3>
              <p className="text-muted-foreground">
                Tracking and celebrating every sustainable action
              </p>
            </div>
          </div>
        </div>

        {/* Why EcoTrack */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12">Why Choose EcoTrack?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0">
              <CardContent className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <Leaf className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4">Environmental Impact</h3>
                <p className="text-muted-foreground">
                  Every action on EcoTrack contributes to measurable environmental change. 
                  From waste reduction to carbon footprint tracking, we make it easy to see 
                  your positive impact on the planet.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Heart className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4">Community Connection</h3>
                <p className="text-muted-foreground">
                  Join a growing community of environmentally conscious individuals. 
                  Participate in local initiatives, share knowledge, and inspire others 
                  to make sustainable choices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">App Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Waste Classification */}
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50/50 to-background border-primary/10">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-emerald-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  <Recycle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Waste Classification</h3>
                <p className="text-muted-foreground mb-4">
                  Upload images or use your camera to instantly classify waste items. Our AI model helps you make informed recycling decisions.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Camera or file upload options
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Instant classification results
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Recycling guidelines
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Community Forum */}
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-background border-primary/10">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-blue-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Forum</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with eco-conscious individuals, share experiences, and learn from the community.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    Create discussions and replies
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    Like and engage with posts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    Report inappropriate content
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Rewards System */}
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50/50 to-background border-primary/10">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-amber-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Rewards Program</h3>
                <p className="text-muted-foreground mb-4">
                  Earn points for your eco-friendly actions and redeem them for exciting rewards.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Points for waste classification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Community engagement rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Redeem for eco-friendly products
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-background border-primary/10">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-purple-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  <Scale className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                <p className="text-muted-foreground mb-4">
                  Monitor your environmental impact and track your contribution to sustainability.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                    Personal impact dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                    Achievement badges
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                    Monthly statistics
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Educational Resources */}
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50/50 to-background border-primary/10">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-green-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  <Globe2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Educational Resources</h3>
                <p className="text-muted-foreground mb-4">
                  Learn about sustainable practices and environmental conservation.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Recycling guides
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Environmental tips
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Sustainability articles
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Community Impact */}
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-red-50/50 to-background border-primary/10">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-red-100 rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Impact</h3>
                <p className="text-muted-foreground mb-4">
                  See the collective impact of our community's sustainable actions.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Global impact metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Community leaderboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Collaborative goals
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-1 mb-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400">
            <span className="px-4 py-1 text-sm font-medium text-white">
              Join the Movement Today
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start your journey towards sustainable living with EcoTrack. Every small action counts 
            towards a bigger change.
          </p>
        </div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Meet the Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Third-year students from Mumbai, passionate about creating sustainable solutions 
              for a better tomorrow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="overflow-hidden bg-gradient-to-br from-background to-primary/5 border-primary/10">
                  <CardContent className="p-6">
                    <div className="aspect-square mb-4 rounded-full overflow-hidden bg-primary/5 relative group">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center');
                          e.currentTarget.parentElement.innerHTML = `
                            <span class="text-4xl font-bold text-primary/50">
                              ${member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          `;
                        }}
                      />
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-center mb-1">{member.name}</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">{member.role}</p>
                    
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/5"
                        asChild
                      >
                        <a href={member.github} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/5"
                        asChild
                      >
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/5"
                        asChild
                      >
                        <a href={`mailto:${member.email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16 text-muted-foreground"
          >
            <p className="text-sm">
              Created with passion at{" "}
              <span className="text-primary">Mumbai University</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImpactAndMission; 