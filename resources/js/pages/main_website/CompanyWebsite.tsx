import React from 'react';
import { NavbarPage } from './navbarPage';
import './style/main.css';

interface CompanyWebsiteProps {
  onNavigate: (to: string) => void;
  currentPath?: string;
}

export const CompanyWebsite: React.FC<CompanyWebsiteProps> = ({
  onNavigate,
  currentPath = '/'
}) => {
  return (
    <NavbarPage onNavigate={onNavigate} currentPath={currentPath} />
  );
};
