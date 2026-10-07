import test from 'node:test';
import assert from 'node:assert/strict';
import {createCandidates,renderSVG,inferMotif,styles} from '../src/generator.js';
test('four editable variants and safe adult account default',()=>{const c=createCandidates({name:'漫画',profile:'猫',audience:'adult',motif:'auto',style:0});assert.equal(c.length,4);assert.equal(new Set(c.map(x=>x.palette)).size,4);assert.ok(c.every(x=>x.motif==='moon'));assert.equal(inferMotif('猫','manga'),'cat');});
test('user text cannot inject SVG',()=>{const svg=renderSVG(createCandidates({name:'<script>&"',profile:'',motif:'star',style:0})[0],'header');assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));});
test('all styles and motifs export both sizes with optional text',()=>{for(let style=0;style<styles.length;style++)for(const motif of ['cat','bunny','book','coffee','moon','heart','star']){const c=createCandidates({name:'テスト',profile:'',motif,style})[0];assert.match(renderSVG(c),/width="400" height="400"/);assert.match(renderSVG(c,'header'),/width="1500" height="500"/);assert.ok(!renderSVG({...c,lettering:'none'},'header').includes('<text'));}});
