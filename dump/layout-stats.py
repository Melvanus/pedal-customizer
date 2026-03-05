#!/usr/bin/env python3
"""Display layout statistics"""
import json
from collections import Counter

with open('data/enclosure_layouts.json') as f:
    layouts = json.load(f)

by_type = Counter([x['enclosure_type'] for x in layouts])
total = len(layouts)

print('='*50)
print('         ENCLOSURE LAYOUT SUMMARY')
print('='*50)
print(f'\nTotal Layouts: {total}\n')

print('By Enclosure Type:')
for enclosure_type in sorted(by_type.keys()):
    count = by_type[enclosure_type]
    pct = (count/total)*100
    bar = '█' * int(count/2)
    print(f'  {enclosure_type:8s}: {count:2d} layouts ({pct:4.1f}%) {bar}')

print('\nMulti-Footswitch Breakdown:')
dual = len([x for x in layouts if '-2fs' in x['id']])
triple = len([x for x in layouts if '-3fs' in x['id']])
single = total - dual - triple
print(f'  Single FS:  {single:2d} layouts ({single/total*100:4.1f}%)')
print(f'  Dual FS:    {dual:2d} layouts ({dual/total*100:4.1f}%)')
print(f'  Triple FS:  {triple:2d} layouts ({triple/total*100:4.1f}%)')

print('\nControl Complexity:')
simple = len([x for x in layouts if x['potentiometer_count'] <= 2])
medium = len([x for x in layouts if 3 <= x['potentiometer_count'] <= 5])
complex = len([x for x in layouts if x['potentiometer_count'] >= 6])
print(f'  Simple (1-2 knobs):  {simple:2d} layouts')
print(f'  Medium (3-5 knobs):  {medium:2d} layouts')
print(f'  Complex (6+ knobs):  {complex:2d} layouts')

print('='*50)
