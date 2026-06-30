'use client';

import { useState } from 'react';
import { Spade, Heart, Diamond, Club, Shuffle, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const suits = { '♠': Spade, '♥': Heart, '♦': Diamond, '♣': Club };
const suitColors = { '♠': 'text-tx-primary', '♥': 'text-ac-rose', '♦': 'text-ac-rose', '♣': 'text-tx-primary' };
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card_ { suit: string; value: string; }

function drawHand(): Card_[] {
  const deck: Card_[] = [];
  for (const s of Object.keys(suits)) for (const v of values) deck.push({ suit: s, value: v });
  const hand: Card_[] = [];
  for (let i = 0; i < 5; i++) hand.push(deck.splice(Math.floor(Math.random() * deck.length), 1)[0]);
  return hand.sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
}

function evalHand(hand: Card_[]): string {
  const counts = hand.reduce((acc, c) => { acc[c.value] = (acc[c.value] || 0) + 1; return acc; }, {} as Record<string, number>);
  const vals = Object.values(counts).sort((a, b) => b - a);
  if (vals[0] === 4) return 'Carré';
  if (vals[0] === 3 && vals[1] === 2) return 'Full';
  if (vals[0] === 3) return 'Brelan';
  if (vals[0] === 2 && vals[1] === 2) return 'Double paire';
  if (vals[0] === 2) return 'Paire';
  return 'Carte haute';
}

export default function PokerPage() {
  const [hand, setHand] = useState<Card_[]>(drawHand());
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  const deal = () => {
    const h = drawHand();
    setHand(h);
    setRounds((r) => r + 1);
    const eval_ = evalHand(h);
    const points: Record<string, number> = { 'Carré': 50, 'Full': 30, 'Brelan': 15, 'Double paire': 10, 'Paire': 5, 'Carte haute': 0 };
    setScore((s) => s + (points[eval_] || 0));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
          <Spade className="text-ac-cyan" /> Bot Poker
        </h1>
        <div className="flex gap-2">
          <Badge color="amber"><Trophy size={12} /> Score: {score}</Badge>
          <Badge color="gray">Round: {rounds}</Badge>
        </div>
      </div>

      <Card className="flex flex-col items-center py-8">
        <div className="flex gap-3 mb-6">
          {hand.map((c, i) => {
            const Icon = suits[c.suit as keyof typeof suits];
            return (
              <div key={i} className="w-20 h-28 rounded-lg bg-bg-float border border-bd-strong flex flex-col items-center justify-center gap-1 shadow-md animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <span className={`text-2xl font-bold ${suitColors[c.suit as keyof typeof suitColors]}`}>{c.value}</span>
                <Icon size={20} className={suitColors[c.suit as keyof typeof suitColors]} />
              </div>
            );
          })}
        </div>
        <Badge color="cyan" className="text-base px-4 py-1">{evalHand(hand)}</Badge>
        <Button onClick={deal} className="mt-6" size="lg"><Shuffle size={18} /> Distribuer</Button>
      </Card>
    </div>
  );
}