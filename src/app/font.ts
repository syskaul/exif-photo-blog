import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

const FONT_PAPER_MONO_FAMILY = 'PaperMono';
const FONT_PAPER_MONO_PATH = '/public/fonts/PaperMono-500.ttf';

const getFontData = async () =>
  fs.readFileSync(path.join(cwd(), FONT_PAPER_MONO_PATH));

export const getPaperMono = () => getFontData()
  .then(data => ({
    fontFamily: FONT_PAPER_MONO_FAMILY,
    fonts: [{
      name: FONT_PAPER_MONO_FAMILY,
      data,
      weight: 500,
      style: 'normal',
    } as const],
  }));

export const getIBMPlexMono = getPaperMono;
