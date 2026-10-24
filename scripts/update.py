"""Prompt without echoing the password; invoke local inventory and encryption tools."""
import argparse, getpass, json, subprocess, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source', nargs='?')
parser.add_argument('--node', default='node')
parser.add_argument('--rekey', action='store_true')
args = parser.parse_args()
if args.rekey:
    old = getpass.getpass('Current password: ')
    new = getpass.getpass('New password (16+ characters): ')
    if new != getpass.getpass('Confirm new password: '):
        raise SystemExit('Passwords do not match.')
    subprocess.run([args.node, str(root/'scripts/rekey.mjs')], input=json.dumps(dict(oldPassword=old,newPassword=new)), text=True, check=True)
else:
    if not args.source:
        parser.error('Provide the local materials folder as the source argument.')
    subprocess.run([sys.executable, str(root/'scripts/catalog.py'), args.source, '--output', str(root/'.private/catalog.json')], check=True)
    password = getpass.getpass('Family password: ')
    subprocess.run([args.node, str(root/'scripts/build.mjs')], input=password, text=True, check=True)
