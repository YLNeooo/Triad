"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Brain, Shield, User } from 'lucide-react';
import Container3D from '@/cedar/components/containers/Container3D';
import Flat3dContainer from '@/cedar/components/containers/Flat3dContainer';
import { TriadBackground } from '@/cedar/components/backgrounds/TriadBackground';
import { cn } from 'cedar-os';

interface TriadInterfaceProps {
  className?: string;
}

export default function TriadInterface({ className }: TriadInterfaceProps) {
  const [activeNode, setActiveNode] = useState<number>(0); 
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  const rotation = useMotionValue(0);

  const nodes = [
    {
      id: 0,
      name: 'User',
      icon: <User className="w-8 h-8" />,
    },
    {
      id: 1,
      name: 'Ego',
      icon: <Brain className="w-8 h-8" />,
    },
    {
      id: 2,
      name: 'Superego',
      icon: <Shield className="w-8 h-8" />,
    },
  ];

  const handleNodeClick = (nodeId: number) => {
    if (nodeId === activeNode || isAnimating) return; // Don't rotate if same node clicked or already animating
    

    const currentIndex = nodes.findIndex(node => node.id === activeNode);
    const targetIndex = nodes.findIndex(node => node.id === nodeId);
    
    const steps = (targetIndex - currentIndex + 3) % 3;
    const rotationIncrement = steps * 120;
    
    setActiveNode(nodeId);
    setIsAnimating(true);
    
    // Animate the rotation smoothly
    const currentRotation = rotation.get();
    animate(rotation, currentRotation + rotationIncrement, {
      duration: 1.2,
      ease: "easeInOut",
      onComplete: () => {
        setIsAnimating(false);
      }
    });
  };


  const getNodeColor = (nodeId: number) => {
    if (activeNode === nodeId) {
      return '#D4AF37';
    }
    return '#8E9AAF';
  };

  return (
    <TriadBackground className={cn("w-full h-screen", className)}>
        <div className="relative w-full h-full overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[80vh] h-[80vh] aspect-square">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <motion.circle
                  cx="200"
                  cy="200"
                  r="120"
                fill="none"
                stroke="#F7F5F3"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </svg>

            {nodes.map((node) => {
              const nodeIndex = nodes.findIndex(n => n.id === node.id);
              
                const x = useTransform(rotation, (r) => {
                  const angle = (nodeIndex * 120 - r) * (Math.PI / 180);
                  return 200 + 120 * Math.sin(angle);
                });
                
                const y = useTransform(rotation, (r) => {
                  const angle = (nodeIndex * 120 - r) * (Math.PI / 180);
                  return 200 + 120 * Math.cos(angle);
                });
              
              return (
                <motion.div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: useTransform(x, (val) => `${(val / 400) * 100}%`),
                    top: useTransform(y, (val) => `${(val / 400) * 100}%`),
                    scale: activeNode === node.id ? 1.1 : 1,
                  }}
                >
                  <Flat3dContainer
                    primaryColor={getNodeColor(node.id)}
                    className={cn(
                      "w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-1000",
                      activeNode === node.id && "ring-4 ring-white/30"
                    )}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="text-white mb-2">
                      {node.icon}
                    </div>
                    <div className="text-sm font-semibold text-white text-center">
                      {node.name}
                    </div>
                  </Flat3dContainer>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </TriadBackground>
  );
}
