<script type="text/javascript" src="run_markdown.js" charset="utf-8"></script>

# Markdown example
The markdown file can be found [here](https://raw.githubusercontent.com/scratch4d/scratch-LN/gh-pages/example/markdown_example.md).



Draw a square:

```scratch
when greenflag clicked
set [teller] to {4}
go to x: {0} y: {0}
pen down
repeat (counter)
move {100} steps
turn cw {({360}/{(counter)})} degrees
end
pen up
```