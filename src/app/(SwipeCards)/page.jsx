"use client";

import React, { useState, useRef } from "react";
import TinderCard from "react-tinder-card";
import { Check, X } from "lucide-react";
import "./SwipeCards.css";

const initialProfiles = [
  {
    id: "p5",
    name: "Sam Lee",
    role: "Database Administrator",
    rate: "$60/hr",
    bio: "I manage databases and ensure uptime. Looking for server optimization work.",
    skills: ["PostgreSQL", "MySQL", "AWS"],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "p4",
    name: "Sarah Jenkins",
    role: "React Native Developer",
    rate: "$50/hr",
    bio: "I build mobile apps using React Native. Over 4 published apps on the App Store.",
    skills: ["React Native", "TypeScript", "Redux"],
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "p3",
    name: "David Smith",
    role: "Backend Dev",
    rate: "$75/hr",
    bio: "Node.js and Python backend setup. I create fast web servers and APIs.",
    skills: ["Node.js", "Express", "Docker"],
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "p2",
    name: "John Doe",
    role: "Systems Architect",
    rate: "$85/hr",
    bio: "Looking for contract roles to architect systems on GCP and AWS. 8 years experience.",
    skills: ["AWS", "GCP", "Terraform"],
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "p1",
    name: "Emily Wang",
    role: "Frontend Dev",
    rate: "$45/hr",
    bio: "I write React and clean HTML/CSS. Open to short-term bug fixing and feature work.",
    skills: ["React", "CSS", "HTML5"],
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
  }
];

export default function SwipeCards() {
  const [profiles, setProfiles] = useState(initialProfiles);
  const childRefs = useRef({});

  const handleSwipe = (direction, id) => {
    if (direction === "right") {
      console.log("Connected with:", id);
    } else if (direction === "left") {
      console.log("Passed on:", id);
    }
  };

  const handleOutOfFrame = (id) => {
    // This perfectly mimics your working reference code!
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    delete childRefs.current[id];
  };

  const swipe = async (dir) => {
    if (profiles.length > 0) {
      // The last element in the array is visually on top
      const topProfile = profiles[profiles.length - 1];
      const ref = childRefs.current[topProfile.id];
      if (ref) {
        await ref.swipe(dir);
      }
    }
  };

  return (
    <div className="freelance-app-container">
     
      
      <div className="swipe-container">
        {profiles.map((profile) => (
          <TinderCard
            key={profile.id}
            ref={(el) => (childRefs.current[profile.id] = el)}
            className="swipe"
            onSwipe={(dir) => handleSwipe(dir, profile.id)}
            onCardLeftScreen={() => handleOutOfFrame(profile.id)}
            preventSwipe={["up", "down"]}
          >
            <div className="card">
              <div 
                className="card-image-section"
                style={{ backgroundImage: 'url(' + profile.image + ')' }}
              >
                <div className="rate-badge">{profile.rate}</div>
              </div>
              <div className="card-info-section">
                <div className="name-role">
                  <h3>{profile.name}</h3>
                  <p className="role">{profile.role}</p>
                </div>
                
                <p className="bio">{profile.bio}</p>
                
                <div className="skills">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </TinderCard>
        ))}
        {profiles.length === 0 && (
          <div className="no-more-cards">
            <h3>No more freelancers found</h3>
            <p>Adjust your filters or check back later!</p>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button onClick={() => swipe("left")} className="btn-action btn-pass" aria-label="Pass">
          <X size={28} />
        </button>
        <button onClick={() => swipe("right")} className="btn-action btn-connect" aria-label="Connect">
          <Check size={28} />
        </button>
      </div>
    </div>
  );
}
