/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Landing } from './components/Landing.js';
import { GameTable } from './components/GameTable.js';
import { useGameStore } from './store.js';

export default function App() {
  const game = useGameStore(state => state.game);
  const error = useGameStore(state => state.error);

  return (
    <div className="w-full min-h-screen bg-omi-swirls">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full z-50 shadow-xl font-bold">
          {error}
        </div>
      )}
      {!game ? <Landing /> : <GameTable />}
    </div>
  );
}
