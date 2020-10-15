import { useEffect, useState } from "react";
import Markdown from 'markdown-it'
import React from "react";

const markdown = new Markdown({ html: true })

// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender = markdown.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
}

markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('target');

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']); // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

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
    dangerouslySetInnerHTML={{ __html: markdown.render(md) }}
    />
}

export default MarkdownPage