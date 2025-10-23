import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ByteRisto app', () => {
  render(<App />);
  const titleElement = screen.getByText(/ByteRisto/i);
  expect(titleElement).toBeInTheDocument();
});
