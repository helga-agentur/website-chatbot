#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import startServer from './chatbotServer/startServer.js';
import fetchEmbedStore from './websiteFetcher/fetchEmbedStore.js';

const importEnvFile = (path: string): void => {
  dotenv.config({ path });
};

program
  .name('website-chatbot')
  .description('A chatbot that answers questions based on a website\'s content.');

program
  .command('serve')
  .option('-e, --env <path>', 'path to the .env file')
  .action((options): void => {
    console.log('Starting server …');
    if (options !== null && typeof options === 'object' && 'env' in options) {
      const { env } = options as { env: string };
      importEnvFile(env);
      startServer()
        .then((): void => { console.log('Server started'); })
        .catch((error: unknown): void => {
          console.error(error);
        });
    } else {
      console.error('Please provide an env file through the --env flag');
    }
  });

program
  .command('fetch')
  .option('-e, --env <path>', 'path to the .env file')
  .option('-d, --delete', 'delete the collection before creating a new one and starting to fetch')
  .action((options): void => {
    console.log('Starting to fetch data …');
    if (options !== null && typeof options === 'object' && 'env' in options) {
      const resetCollection = (options as { delete?: boolean }).delete;
      const { env } = options as { env: string };
      importEnvFile(env);
      fetchEmbedStore({ resetCollection })
        .catch((error: unknown): void => {
          console.error(error);
        });
    } else {
      console.error('Please provide an env file through the --env flag');
    }
  });
program.parse();
