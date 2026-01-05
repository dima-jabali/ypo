"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStore, useMembers } from "@/lib/store";
import { User, Briefcase, Target, Heart, MapPin, Save, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const members = useStore(useMembers);
  const currentUser = members[0]; // Demo: using first member as current user

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: currentUser.bio,
    linkedinBio: currentUser.linkedinBio || "",
    interests: currentUser.interests,
    expertise: currentUser.expertise,
    personalGoals: currentUser.personalGoals || [],
    ceoDNA: {
      health: currentUser.ceoDNA?.health || [],
      wellness: currentUser.ceoDNA?.wellness || [],
      sports: currentUser.ceoDNA?.sports || [],
      hobbies: currentUser.ceoDNA?.hobbies || [],
    },
  });

  const [newInterest, setNewInterest] = useState("");
  const [newExpertise, setNewExpertise] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newHealth, setNewHealth] = useState("");
  const [newWellness, setNewWellness] = useState("");
  const [newSport, setNewSport] = useState("");
  const [newHobby, setNewHobby] = useState("");

  const handleSave = () => {
    // In a real app, this would update the backend
    console.log("[v0] Saving profile updates:", formData);
    setIsEditing(false);
  };

  const addItem = (category: string, value: string) => {
    if (!value.trim()) return;

    switch (category) {
      case "interests":
        setFormData({ ...formData, interests: [...formData.interests, value] });
        setNewInterest("");
        break;
      case "expertise":
        setFormData({ ...formData, expertise: [...formData.expertise, value] });
        setNewExpertise("");
        break;
      case "goals":
        setFormData({ ...formData, personalGoals: [...formData.personalGoals, value] });
        setNewGoal("");
        break;
      case "health":
        setFormData({
          ...formData,
          ceoDNA: { ...formData.ceoDNA, health: [...formData.ceoDNA.health, value] },
        });
        setNewHealth("");
        break;
      case "wellness":
        setFormData({
          ...formData,
          ceoDNA: { ...formData.ceoDNA, wellness: [...formData.ceoDNA.wellness, value] },
        });
        setNewWellness("");
        break;
      case "sports":
        setFormData({
          ...formData,
          ceoDNA: { ...formData.ceoDNA, sports: [...formData.ceoDNA.sports, value] },
        });
        setNewSport("");
        break;
      case "hobbies":
        setFormData({
          ...formData,
          ceoDNA: { ...formData.ceoDNA, hobbies: [...formData.ceoDNA.hobbies, value] },
        });
        setNewHobby("");
        break;
    }
  };

  const removeItem = (category: string, index: number) => {
    switch (category) {
      case "interests":
        setFormData({
          ...formData,
          interests: formData.interests.filter((_, i) => i !== index),
        });
        break;
      case "expertise":
        setFormData({
          ...formData,
          expertise: formData.expertise.filter((_, i) => i !== index),
        });
        break;
      case "goals":
        setFormData({
          ...formData,
          personalGoals: formData.personalGoals.filter((_, i) => i !== index),
        });
        break;
      case "health":
        setFormData({
          ...formData,
          ceoDNA: {
            ...formData.ceoDNA,
            health: formData.ceoDNA.health.filter((_, i) => i !== index),
          },
        });
        break;
      case "wellness":
        setFormData({
          ...formData,
          ceoDNA: {
            ...formData.ceoDNA,
            wellness: formData.ceoDNA.wellness.filter((_, i) => i !== index),
          },
        });
        break;
      case "sports":
        setFormData({
          ...formData,
          ceoDNA: {
            ...formData.ceoDNA,
            sports: formData.ceoDNA.sports.filter((_, i) => i !== index),
          },
        });
        break;
      case "hobbies":
        setFormData({
          ...formData,
          ceoDNA: {
            ...formData.ceoDNA,
            hobbies: formData.ceoDNA.hobbies.filter((_, i) => i !== index),
          },
        });
        break;
    }
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information, interests, and goals
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage
                  src={currentUser.avatar || "/placeholder.svg"}
                  alt={currentUser.name}
                />
                <AvatarFallback className="text-3xl">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mb-1">{currentUser.name}</h2>
              <p className="text-muted-foreground mb-2">{currentUser.title}</p>
              <p className="text-primary font-semibold mb-4">{currentUser.company}</p>
              {isEditing && (
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Change Photo
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Years in YPO</span>
                <span className="font-semibold">{currentUser.yearsInYPO}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Connection Score</span>
                <Badge variant="default">{currentUser.socialScore}%</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Events Attended</span>
                <span className="font-semibold">{currentUser.recentEvents.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location & Travel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{currentUser.location}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Frequent Travel</p>
                <div className="flex flex-wrap gap-1">
                  {currentUser.travelPattern.map((city, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editable Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>About Me</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {formData.bio}
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <Label htmlFor="linkedin">LinkedIn Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="linkedin"
                    value={formData.linkedinBio}
                    onChange={(e) => setFormData({ ...formData, linkedinBio: e.target.value })}
                    rows={3}
                    className="mt-2"
                    placeholder="Your professional headline..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">{formData.linkedinBio}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Professional Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="expertise" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expertise">Expertise</TabsTrigger>
                  <TabsTrigger value="interests">Interests</TabsTrigger>
                </TabsList>

                <TabsContent value="expertise" className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.expertise.map((exp, idx) => (
                      <Badge key={idx} variant="default" className="gap-1">
                        {exp}
                        {isEditing && (
                          <button
                            onClick={() => removeItem("expertise", idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newExpertise}
                        onChange={(e) => setNewExpertise(e.target.value)}
                        placeholder="Add expertise..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("expertise", newExpertise);
                          }
                        }}
                      />
                      <Button onClick={() => addItem("expertise", newExpertise)}>Add</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="interests" className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {interest}
                        {isEditing && (
                          <button
                            onClick={() => removeItem("interests", idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add interest..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("interests", newInterest);
                          }
                        }}
                      />
                      <Button onClick={() => addItem("interests", newInterest)}>Add</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Goals & Aspirations</CardTitle>
              </div>
              <CardDescription>What you're working towards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {formData.personalGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-3 group">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm flex-1">{goal}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeItem("goals", idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a goal..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem("goals", newGoal);
                      }
                    }}
                  />
                  <Button onClick={() => addItem("goals", newGoal)}>Add</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <CardTitle>CEO DNA</CardTitle>
              </div>
              <CardDescription>Your lifestyle, wellness, and personal interests</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="health" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="health">Health</TabsTrigger>
                  <TabsTrigger value="wellness">Wellness</TabsTrigger>
                  <TabsTrigger value="sports">Sports</TabsTrigger>
                  <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
                </TabsList>

                <TabsContent value="health" className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.ceoDNA.health.map((item, idx) => (
                      <Badge key={idx} variant="default" className="gap-1">
                        {item}
                        {isEditing && (
                          <button
                            onClick={() => removeItem("health", idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newHealth}
                        onChange={(e) => setNewHealth(e.target.value)}
                        placeholder="Add health practice..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("health", newHealth);
                          }
                        }}
                      />
                      <Button onClick={() => addItem("health", newHealth)}>Add</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="wellness" className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.ceoDNA.wellness.map((item, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {item}
                        {isEditing && (
                          <button
                            onClick={() => removeItem("wellness", idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newWellness}
                        onChange={(e) => setNewWellness(e.target.value)}
                        placeholder="Add wellness practice..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("wellness", newWellness);
                          }
                        }}
                      />
                      <Button onClick={() => addItem("wellness", newWellness)}>Add</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sports" className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.ceoDNA.sports.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1">
                        {item}
                        {isEditing && (
                          <button
                            onClick={() => removeItem("sports", idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newSport}
                        onChange={(e) => setNewSport(e.target.value)}
                        placeholder="Add sport..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("sports", newSport);
                          }
                        }}
                      />
                      <Button onClick={() => addItem("sports", newSport)}>Add</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hobbies" className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.ceoDNA.hobbies.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1">
                        {item}
                        {isEditing && (
                          <button
                            onClick={() => removeItem("hobbies", idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newHobby}
                        onChange={(e) => setNewHobby(e.target.value)}
                        placeholder="Add hobby..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("hobbies", newHobby);
                          }
                        }}
                      />
                      <Button onClick={() => addItem("hobbies", newHobby)}>Add</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
