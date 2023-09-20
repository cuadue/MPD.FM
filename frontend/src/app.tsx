import React from 'react';
import { useState } from 'react';
import { useParams, Routes, Route } from 'react-router';
import { Link, useNavigate } from 'react-router-dom';

const nextItemStatus = status => {
  const statuses = ['pending', 'in_progress', 'done'];
  const index = (statuses.findIndex(s => s === status) + 1) % statuses.length;
  return statuses[index];
};

/*
const Item = ({id, onClick}) => {
  const {data: item, ...q} = api.useGetItemQuery(id);
  const [updateItem] = api.useUpdateItemMutation();

  if (q.isLoading) {
    return <li>loading...</li>
  } else if (q.isError) {
    return <li>Error: {JSON.stringify(q.error)}</li>
  } else if (q.isSuccess) {
    const status = item.status || nextItemStatus();
    return <li key={item.id}>
      <span className={`status ${status}`} onClick={()=>
          updateItem({
            id: item.id,
            status: nextItemStatus(status)
          })
        }>
      </span>
      {' '}
      <Link to={`/edit/${item.id}`}>&#x270e;</Link>
      {' '}
      <b>{item.title}</b>
      {' '}
      {item.content}
    </li>
  } else {
    return <li>Something went wrong {JSON.stringify(q)}</li>
  }
};

const ListOfItems = () => {
  const {data: items, ...q} = api.useGetItemsQuery();

  if (q.isLoading) {
      return <p>loading...</p>
  } else if (q.isError) {
      return <p>Error: {JSON.stringify(q.error)}</p>
  } else if (q.isSuccess) {
    return <ul> {
      Object.values(items).map(item =>
        <Item key={item.id} id={item.id} />
      )
    } </ul>
  } else {
      return <p>Something went wrong {JSON.stringify(q)}</p>
  }
};

const ItemFormEdit = () => {
  const [submitted, setSubmitted] = useState(false);
  const {id} = useParams();
  const {data: item, ...getQ} = api.useGetItemQuery(id);
  const [updateItem, updateQ] = api.useUpdateItemMutation();
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    updateItem(id, Object.fromEntries(new FormData(e.target)));
    setSubmitted(true);
  };

  if (updateQ.isSuccess) {
    navigate("/");
    return <></>
  }

  return <ItemForm item={item} onSubmit={onSubmit}
    disabled={submitted || getQ.isFetching} />
};

const ItemFormNew = () => {
  const [addItem, q] = api.useAddItemMutation();
  const onSubmit = (e) => {
    e.preventDefault();
    addItem(Object.fromEntries(new FormData(e.target)));
  };
  return <ItemForm onSubmit={onSubmit} />
}

const ItemForm = ({item = {}, disabled = false, onSubmit}) => {
  return <form onSubmit={onSubmit}>
    <input name='title' defaultValue={item.title || ''}/>
    <input name='content' defaultValue={item.content || ''} />
    <button type='submit'>Add</button>
  </form>
};

const TopNav = () => {
  return <>
    <Link to='/new'>New Item</Link>
    {' '}
    Show:
    {' '}
    <Link to='/filter/pending'>Pending</Link>
    {' '}
    <Link to='/filter/active'>Active</Link>
    {' '}
    <Link to='/filter/done'>Done</Link>
  </>
};
*/

export const App = () => <></>;
/*
  <TopNav />
  <Routes>
    <Route path='/' element={<ListOfItems />} />
    <Route path='/new' element={
      <>
      <ItemFormNew />
      <ListOfItems />
      </>
    } />
    <Route path='/edit/:id' element={
      <>
      <ItemFormEdit />
      <ListOfItems />
      </>
    } />
  </Routes>
</>;
*/