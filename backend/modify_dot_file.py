import pydot

# Wczytaj plik .dot
(graph,) = pydot.graph_from_dot_file('my_project_erd.dot')

# Przejdź przez wszystkie węzły i usuń typy pól
for node in graph.get_nodes():
    label = node.get_label()
    if label:
        #print(f"Original label: {label}")  # Debugowanie
        # Usuń typy pól z etykiety
        new_label = []
        for line in label.strip('"').split('\\n'):
            if ':' in line:
                field_name = line.split(':')[0].strip()
                new_label.append(field_name)
            else:
                new_label.append(line)
        new_label_str = '"' + '\\n'.join(new_label) + '"'
        #print(f"New label: {new_label_str}")  # Debugowanie
        node.set_label(new_label_str)

# Zapisz zmodyfikowany plik .dot
graph.write('my_project_erd_modified.dot')

# Opcjonalnie: wygeneruj plik graficzny z zmodyfikowanego pliku .dot
try:
    graph.write_png('my_project_erd.png')
except Exception as e:
    print(f"Error generating PNG: {e}")