Create a Note

const note = await createNote({
  userId: 'user123',
  title: 'My Note',
  content: 'This is the note content',
  tags: ['important', 'work'],
  category: 'work',
  priority: 'high'
});

Get User Notes with Filtering

const notes = await getUserNotes('user123', {
  category: 'work',
  isArchived: false,
  limit: 10,
  orderBy: 'updatedAt',
  orderDirection: 'desc'
});

Search Notes

const results = await searchNotes('user123', 'important meeting');