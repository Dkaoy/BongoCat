#!/usr/bin/env node
/**
 * BongoCat API Tester
 * 
 * This script allows you to test an API to see if it's compatible with BongoCat's API message feature.
 * It simulates how BongoCat would process the API response and shows what would be displayed.
 * 
 * Usage:
 *   node api-tester.js <API_URL>
 * 
 * Example:
 *   node api-tester.js https://api.quotable.io/random
 */

import https from 'https';
import http from 'http';
import { parse as parseUrl } from 'url';

if (process.argv.length < 3) {
  console.log('\x1b[31mError: Missing API URL\x1b[0m');
  console.log('Usage: node api-tester.js <API_URL>');
  process.exit(1);
}

const apiUrl = process.argv[2];
console.log(`\x1b[34mTesting API: ${apiUrl}\x1b[0m\n`);

// Parse the URL to determine if it's HTTP or HTTPS
const parsedUrl = parseUrl(apiUrl);
const client = parsedUrl.protocol === 'https:' ? https : http;

// Create a GET request to the API with option to ignore certificate errors
const options = {
  rejectUnauthorized: false // This allows self-signed certificates or expired ones
};
const request = client.get(apiUrl, options, (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  console.log(`\x1b[32mStatus Code: ${statusCode}\x1b[0m`);
  console.log(`\x1b[32mContent-Type: ${contentType || 'unknown'}\x1b[0m`);
  
  let error;
  if (statusCode !== 200) {
    error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
  }

  if (error) {
    console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
    // Consume response data to free up memory
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  
  res.on('data', (chunk) => { rawData += chunk; });
  
  res.on('end', () => {
    try {
      console.log('\n\x1b[33mRaw Response:\x1b[0m');
      console.log('------------------------');
      console.log(rawData.length > 500 ? rawData.substring(0, 500) + '...' : rawData);
      console.log('------------------------\n');

      let message = '';
      
      // Try to parse as JSON
      let isJson = contentType && contentType.includes('application/json');
      if (!isJson && rawData.trim().startsWith('{')) {
        isJson = true;
        console.log('\x1b[33mDetected JSON response despite content-type\x1b[0m');
      }
      
      if (isJson) {
        console.log('\x1b[33mParsing as JSON...\x1b[0m');
        const jsonData = JSON.parse(rawData);
        
        // Try to extract message from common JSON fields
        message = jsonData.message || 
                 jsonData.content || 
                 jsonData.text || 
                 jsonData.joke || 
                 jsonData.quote || 
                 jsonData.fact ||
                 jsonData.data?.text ||
                 jsonData.data?.content ||
                 jsonData.result?.text ||
                 jsonData.result?.content;
                 
        if (jsonData.setup && jsonData.punchline) {
          message = `${jsonData.setup} ${jsonData.punchline}`;
        }
        
        // Try arrays
        if (!message && Array.isArray(jsonData) && jsonData.length > 0) {
          const firstItem = jsonData[0];
          if (typeof firstItem === 'string') {
            message = firstItem;
          } else if (typeof firstItem === 'object') {
            message = firstItem.message || 
                     firstItem.content || 
                     firstItem.text || 
                     firstItem.joke || 
                     firstItem.quote ||
                     firstItem.q ||
                     firstItem.fact;
          }
        }
        
        // If still no message, try to find the first string property
        if (!message) {
          console.log('\x1b[33mNo standard fields found, searching for string properties...\x1b[0m');
          const findStringValue = (obj) => {
            for (const key in obj) {
              if (typeof obj[key] === 'string' && obj[key].length > 0) {
                return obj[key];
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                const nestedResult = findStringValue(obj[key]);
                if (nestedResult) return nestedResult;
              }
            }
            return null;
          };
          
          message = findStringValue(jsonData);
        }
        
        // Last resort: convert entire JSON to string
        if (!message) {
          console.log('\x1b[33mNo suitable message found, using JSON stringify\x1b[0m');
          message = JSON.stringify(jsonData, null, 2);
        }
      } else {
        // Handle as plain text
        console.log('\x1b[33mHandling as text response...\x1b[0m');
        message = rawData;
      }
      
      // Limit message length for display
      if (message && message.length > 500) {
        message = message.substring(0, 497) + '...';
      }
      
      console.log('\n\x1b[32mExtracted Message (what would appear in BongoCat):\x1b[0m');
      console.log('------------------------');
      console.log(message || '\x1b[31mNo message could be extracted\x1b[0m');
      console.log('------------------------\n');
      
      console.log('\x1b[34mSummary:\x1b[0m');
      if (message) {
        console.log('\x1b[32m✓ This API is compatible with BongoCat\'s API message feature\x1b[0m');
      } else {
        console.log('\x1b[31m✗ Could not extract a suitable message from this API\x1b[0m');
        console.log('\x1b[33mTry a different API or check the API_CORS_GUIDE.md for creating a proxy\x1b[0m');
      }
      
    } catch (e) {
      console.error('\x1b[31mError parsing response:\x1b[0m', e.message);
      console.log('\x1b[33mHandling as text response instead...\x1b[0m');
      console.log('\n\x1b[32mExtracted Message (what would appear in BongoCat):\x1b[0m');
      console.log('------------------------');
      console.log(rawData.length > 500 ? rawData.substring(0, 497) + '...' : rawData);
      console.log('------------------------\n');
    }
  });
}).on('error', (e) => {
  console.error(`\x1b[31mError: ${e.message}\x1b[0m`);
  
  if (e.message.includes('ENOTFOUND') || e.message.includes('getaddrinfo')) {
    console.log('\x1b[33mThere might be an issue with the domain name or your internet connection.\x1b[0m');
  } else if (e.message.includes('ECONNREFUSED')) {
    console.log('\x1b[33mConnection was refused. The server might be down or the port might be incorrect.\x1b[0m');
  } else if (e.message.includes('CERT_HAS_EXPIRED')) {
    console.log('\x1b[33mThe SSL certificate of the API has expired.\x1b[0m');
  }
});

// Set a timeout for the request
request.setTimeout(10000, () => {
  request.abort();
  console.error('\x1b[31mRequest timed out after 10 seconds\x1b[0m');
});
