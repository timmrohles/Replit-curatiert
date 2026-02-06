/**
 * UI Core Components - Centralized Exports
 * 
 * Import all core layout components from one place:
 * import { Section, Container, Heading, Text } from '@/components/ui';
 */

export { Section } from './section';
export { Container } from './container';
export { Heading, Text, Price, Label } from './typography';

// Re-export existing shadcn components for convenience
export { Button } from './button';
export { Input } from './input';
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './card';
