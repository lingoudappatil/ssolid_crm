import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaTrash, FaEdit, FaPlus, FaUndo, FaMoon, FaSun, FaSave, FaTimes, FaFilter, FaSort, FaCalendar, FaExclamationTriangle, FaCheck, FaEllipsisV } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import './Todo.css';

const Todo = () => {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [deletedTodo, setDeletedTodo] = useState(null);
  const [theme, setTheme] = useState('light');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTodo, setSelectedTodo] = useState(null);

  // Local storage sync
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Add new todo
  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newTodo = {
      id: uuidv4(),
      text: input,
      completed: false,
      category,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    setTodos([newTodo, ...todos]);
    setInput('');
    setDueDate('');
    setCategory('personal');
    setPriority('medium');
  };

  // Start editing todo
  const startEdit = (todo) => {
    setEditId(todo.id);
    setEditText(todo.text);
    setCategory(todo.category);
    setPriority(todo.priority);
    setDueDate(todo.dueDate);
  };

  // Save edited todo
  const saveEdit = () => {
    if (!editText.trim()) return;
    
    setTodos(todos.map(todo =>
      todo.id === editId
        ? { ...todo, text: editText, category, priority, dueDate }
        : todo
    ));
    setEditId(null);
    setEditText('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditId(null);
    setEditText('');
  };

  // Delete todo with undo capability
  const deleteTodo = (id) => {
    const todoToDelete = todos.find(todo => todo.id === id);
    setDeletedTodo({ ...todoToDelete, deletedAt: Date.now() });
    setTodos(todos.filter(todo => todo.id !== id));
    
    setTimeout(() => {
      setDeletedTodo(null);
    }, 5000);
  };

  // Undo delete
  const undoDelete = () => {
    if (deletedTodo) {
      setTodos([deletedTodo, ...todos]);
      setDeletedTodo(null);
    }
  };

  // Toggle completion
  const toggleComplete = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id 
        ? { 
            ...todo, 
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date().toISOString() : null
          }
        : todo
    ));
  };

  // Clear all completed todos
  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  // Handle drag & drop
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTodos(items);
  };

  // Check if todo is overdue
  const isOverdue = (todo) => {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  // Filtered and sorted todos
  const filteredTodos = todos
    .filter(todo => {
      const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompletion = showCompleted ? true : !todo.completed;
      const matchesPriority = filterPriority === 'all' ? true : todo.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' ? true : todo.category === filterCategory;
      
      return matchesSearch && matchesCompletion && matchesPriority && matchesCategory;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'created':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  // Statistics
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;
  const overdueTodos = todos.filter(isOverdue).length;

  // Theme toggle
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffbb33';
      case 'low': return '#00C851';
      default: return '#33b5e5';
    }
  };

  // Category colors
  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return '#4285F4';
      case 'personal': return '#9C27B0';
      case 'shopping': return '#FF9800';
      case 'health': return '#4CAF50';
      default: return '#795548';
    }
  };

  return (
    <div className={`todo-container ${theme}`}>
      <div className="header">
        <h1>Advanced Todo App</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
      </div>

      {/* Statistics */}
      <div className="stats">
        <div className="stat-item">
          <span>Total</span>
          <span>{totalTodos}</span>
        </div>
        <div className="stat-item">
          <span>Completed</span>
          <span>{completedTodos}</span>
        </div>
        <div className="stat-item">
          <span>Pending</span>
          <span>{pendingTodos}</span>
        </div>
        <div className="stat-item">
          <span>Overdue</span>
          <span className={overdueTodos > 0 ? 'overdue' : ''}>{overdueTodos}</span>
        </div>
      </div>

      {/* Add/Edit Todo Form */}
      <form onSubmit={editId ? saveEdit : addTodo} className="todo-form">
        <input
          type="text"
          value={editId ? editText : input}
          onChange={(e) => editId ? setEditText(e.target.value) : setInput(e.target.value)}
          placeholder={editId ? "Edit your todo..." : "What needs to be done?"}
          className="todo-input"
        />
        
        <div className="form-controls">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
            <option value="health">Health</option>
          </select>
          
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="date-input"
          />
          
          <div className="form-actions">
            {editId ? (
              <>
                <button type="submit" className="save-button">
                  <FaSave /> Save
                </button>
                <button type="button" onClick={cancelEdit} className="cancel-button">
                  <FaTimes /> Cancel
                </button>
              </>
            ) : (
              <button type="submit" className="add-button">
                <FaPlus /> Add
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Controls */}
      <div className="controls">
        <div className="control-group">
          <input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
            <option value="health">Health</option>
          </select>
        </div>
        
        <div className="control-group">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="created">Sort by Created</option>
            <option value="priority">Sort by Priority</option>
            <option value="dueDate">Sort by Due Date</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="sort-order-button"
          >
            <FaSort /> {sortOrder === 'desc' ? 'Desc' : 'Asc'}
          </button>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
            />
            Show Completed
          </label>
          
          <button onClick={clearCompleted} className="clear-button">
            <FaTrash /> Clear Completed
          </button>
        </div>
      </div>

      {/* Undo Notification */}
      {deletedTodo && (
        <div className="undo-notification">
          <span>Todo "{deletedTodo.text}" deleted</span>
          <button onClick={undoDelete} className="undo-button">
            <FaUndo /> Undo
          </button>
        </div>
      )}

      {/* Todo List */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="todo-list"
            >
              {filteredTodos.length === 0 ? (
                <div className="empty-state">
                  <p>No todos found. {searchTerm && 'Try changing your search or filters.'}</p>
                </div>
              ) : (
                filteredTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`todo-item ${todo.completed ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''} ${isOverdue(todo) ? 'overdue' : ''}`}
                      >
                        <div className="todo-content">
                          <div className="todo-main">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => toggleComplete(todo.id)}
                              className="complete-checkbox"
                            />
                            
                            <div className="todo-text">
                              <span>{todo.text}</span>
                              <div className="todo-meta">
                                <span 
                                  className="category-badge"
                                  style={{ backgroundColor: getCategoryColor(todo.category) }}
                                >
                                  {todo.category}
                                </span>
                                <span 
                                  className="priority-badge"
                                  style={{ backgroundColor: getPriorityColor(todo.priority) }}
                                >
                                  {todo.priority}
                                </span>
                                {todo.dueDate && (
                                  <span className="due-date">
                                    <FaCalendar /> {new Date(todo.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {isOverdue(todo) && (
                                  <span className="overdue-badge">
                                    <FaExclamationTriangle /> Overdue
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="todo-actions">
                            <button 
                              onClick={() => startEdit(todo)} 
                              className="edit-button"
                              disabled={editId === todo.id}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={() => deleteTodo(todo.id)} 
                              className="delete-button"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        
                        {editId === todo.id && (
                          <div className="edit-overlay">
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="edit-input"
                                autoFocus
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Todo;