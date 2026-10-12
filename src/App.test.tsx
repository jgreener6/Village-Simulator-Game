import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { SAVE_KEY } from './game/useGame';

beforeEach(() => {
  localStorage.clear();
});

function getTile(row: number, col: number) {
  return screen.getByRole('button', { name: new RegExp(`^Row ${row}, column ${col}:`) });
}

it('renders a 5x5 map of empty tiles', () => {
  render(<App />);
  expect(screen.getAllByRole('button', { name: /: empty$/ })).toHaveLength(25);
});

it('builds a house on a selected tile', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(getTile(1, 1));
  await user.click(screen.getByRole('button', { name: 'Build House' }));

  expect(getTile(1, 1)).toHaveAccessibleName('Row 1, column 1: House, level 1');
  expect(screen.getByTestId('resource-people')).toHaveTextContent('5');
  expect(screen.getByTestId('resource-lumber')).toHaveTextContent('0');
});

it('disables builds the village cannot afford', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(getTile(3, 3));
  expect(screen.getByRole('button', { name: 'Build Field' })).toBeDisabled();
});

it('advances the day and records it in the chronicle', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'End day' }));

  expect(screen.getByTestId('day')).toHaveTextContent('Day 2');
  const chronicle = screen.getByRole('region', { name: 'Village chronicle' });
  expect(within(chronicle).getByText(/Day 1 ends/)).toBeInTheDocument();
});

it('moves the selection with the arrow keys', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(getTile(1, 1));
  await user.keyboard('{ArrowRight}{ArrowDown}');

  expect(getTile(2, 2)).toHaveFocus();
  expect(getTile(2, 2)).toHaveAttribute('aria-pressed', 'true');
});

it('restores a saved game from localStorage', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  await user.click(getTile(1, 1));
  await user.click(screen.getByRole('button', { name: 'Build House' }));
  unmount();

  expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
  render(<App />);
  expect(getTile(1, 1)).toHaveAccessibleName('Row 1, column 1: House, level 1');
});
