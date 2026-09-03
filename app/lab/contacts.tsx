import { Stack } from 'expo-router';

import { ContactList } from '@/components/lists/contact-list';

/** The converted list: `{ id, name }`, explicit keyExtractor, separators, pull-to-refresh. */
export default function ContactsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Contacts' }} />
      <ContactList />
    </>
  );
}
