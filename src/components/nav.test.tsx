import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './nav';

// Mock global de fetch
global.fetch = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: "Perfumes", slug: "perfumes", parent: 0 }],
    });
  });

  it('debe renderizar el buscador', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </QueryClientProvider>
    );
    const searchInput = screen.getByPlaceholderText(/BUSCAR PRODUCTOS/i);
    expect(searchInput).toBeDefined();
  });
});
