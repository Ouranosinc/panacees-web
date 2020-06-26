import { useEffect, useState } from "react";
import Markdown from 'markdown-it'
import React from "react";

/** Simple markdown page */
const MarkdownPage = (props: { path: string }) => {
  const [md, setMd] = useState<string>()
  
  useEffect(() => {
    fetch(props.path).then((response) => response.text()).then((md) => {
      setMd(md)
    })
  }, [props.path])

  if (!md) {
    return <div className="text-muted">Chargement...</div>
  }

  return <div 
    style={{ textAlign: "center", paddingTop: 20 }}
    dangerouslySetInnerHTML={{ __html: new Markdown({ html: true }).render(md) }}
    />
}

export default MarkdownPage