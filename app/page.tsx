'use client';

import { useCallback, useState } from 'react';
import SmoothScroll from '@/components/ui/SmoothScroll';
import Preloader from '@/components/ui/Preloader';
import Navigation from '@/components/ui/Navigation';
import Cursor from '@/components/ui/Cursor';
import { Overlays } from '@/components/ui/Overlays';
import BeanStage from '@/components/stage/BeanStage';
import Hero from '@/components/scenes/Hero';
import OriginScene from '@/components/scenes/OriginScene';
import CraftScene from '@/components/scenes/CraftScene';
import RoastingScene from '@/components/scenes/RoastingScene';
import AromaScene from '@/components/scenes/AromaScene';
import BrewScene from '@/components/scenes/BrewScene';
import ProductScene from '@/components/scenes/ProductScene';
import FinalScene from '@/components/scenes/FinalScene';
import Footer from '@/components/scenes/Footer';

/**
 * One page, one shot.
 *
 * The sections below carry only type. Every visual — beans, splash, dust,
 * backdrop — lives in <BeanStage>, which sits behind them for the whole
 * document and reads these sections as marks on its timeline. The order of
 * the `data-scene` sections is the order of the choreography, so moving one
 * moves the film with it.
 */

export default function Page() {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);

  return (
    <SmoothScroll>
      <Cursor />
      <BeanStage started={started} />
      <Overlays />
      <Navigation />

      <main className="relative">
        <Hero />
        <OriginScene />
        <CraftScene />
        <RoastingScene />
        <AromaScene />
        <BrewScene />
        <ProductScene />
        <FinalScene />
        <Footer />
      </main>

      <Preloader onComplete={start} />
    </SmoothScroll>
  );
}
