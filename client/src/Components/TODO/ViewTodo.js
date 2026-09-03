import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaTrash, FaEdit, FaSearch, FaFilter, FaSort, FaCalendar, FaExclamationTriangle, FaCheck, FaMoon, FaSun, FaUndo } from 'react-icons/fa';
import './Todo.css';

const ViewTodo = () => {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [theme, setTheme] = useState('light');
  const [deletedTodo, setDeletedTodo] = useState(null);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTodos(items);
  };

  const toggleComplete = (id) => {
    setTodos(
      todos.map(todo =>
        todo.id === id 
          ? { 
              ...todo, 
              completed: !todo.completed,
              completedAt: !todo.completed ? new Date().toISOString() : null
            } 
          : todo
      )
    );
  };

  // Check if todo is overdue
  const isOverdue = (todo) => {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  // Filter and search logic
  const getFilteredAndSortedTodos = () => {
    let filteredTodos = todos;

    // Apply status filter
    if (filterStatus !== 'all') {
      filteredTodos = filteredTodos.filter(todo => 
        filterStatus === 'completed' ? todo.completed : !todo.completed
      );
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.priority === filterPriority);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.category === filterCategory);
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredTodos = filteredTodos.filter(todo =>
        todo.text.toLowerCase().includes(searchLower) ||
        (todo.category && todo.category.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    return filteredTodos.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
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
      
      if (sortBy === 'category') {
        return sortOrder === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  };

  const filteredTodos = getFilteredAndSortedTodos();

  // Enhanced stats calculation
  const stats = {
    total: todos.length,
    completed: todos.filter(todo => todo.completed).length,
    pending: todos.filter(todo => !todo.completed).length,
    overdue: todos.filter(todo => isOverdue(todo)).length
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

  // Theme toggle
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`todo-container ${theme}`}>
      <div className="header">
        <h1>View Todos</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
      </div>

      {/* Enhanced Statistics */}
      <div className="stats">
        <div className="stat-item">
          <span>Total</span>
          <span>{stats.total}</span>
        </div>
        <div className="stat-item">
          <span>Completed</span>
          <span>{stats.completed}</span>
        </div>
        <div className="stat-item">
          <span>Pending</span>
          <span>{stats.pending}</span>
        </div>
        <div className="stat-item">
          <span>Overdue</span>
          <span className={stats.overdue > 0 ? 'overdue' : ''}>{stats.overdue}</span>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="controls">
        <div className="control-group">
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          
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
            <option value="category">Sort by Category</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="sort-order-button"
          >
            <FaSort /> {sortOrder === 'desc' ? 'Desc' : 'Asc'}
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

      {/* Enhanced Todo List */}
      <DragDropContext onDragEnd={handleDragEnd}>
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
                                {todo.category && (
                                  <span 
                                    className="category-badge"
                                    style={{ backgroundColor: getCategoryColor(todo.category) }}
                                  >
                                    {todo.category}
                                  </span>
                                )}
                                {todo.priority && (
                                  <span 
                                    className="priority-badge"
                                    style={{ backgroundColor: getPriorityColor(todo.priority) }}
                                  >
                                    {todo.priority}
                                  </span>
                                )}
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
                                {todo.completed && todo.completedAt && (
                                  <span className="completed-badge">
                                    <FaCheck /> Completed on {new Date(todo.completedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="todo-actions">
                            <button 
                              onClick={() => deleteTodo(todo.id)} 
                              className="delete-button"
                              title="Delete todo"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
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

export default ViewTodo;