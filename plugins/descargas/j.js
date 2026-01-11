export async function all(m) {
  if (!m.text) return

  const t = m.text.trim().toLowerCase()

  if (t === 'menu') {
    m.text = '.menu'
  }

  if (t === 'owner') {
    m.text = '.owner'
  }
}

export default {}